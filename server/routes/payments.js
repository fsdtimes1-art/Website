const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');
const { generateTicketsAndSendEmails } = require('../services/ticketService');
const { Safepay } = require('@sfpy/node-sdk');

const safepay = new Safepay({
  environment:   process.env.SAFEPAY_ENV || 'sandbox',
  apiKey:        process.env.SAFEPAY_API_KEY,
  v1Secret:      process.env.SAFEPAY_SECRET_KEY,
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET || '',
});

// POST /api/payments/create-checkout
router.post('/create-checkout', async (req, res) => {
  try {
    const { eventId, categoryId, quantity, buyerName, buyerEmail, buyerPhone } = req.body;

    if (!eventId || !categoryId || !quantity || !buyerName || !buyerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: category, error: catError } = await supabase
      .from('seat_categories')
      .select('*, events(*)')
      .eq('id', categoryId)
      .single();

    if (catError || !category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const available = category.total_seats - category.sold_seats;
    if (quantity > available) {
      return res.status(400).json({ error: `Only ${available} seat(s) available in this category` });
    }

    const totalAmount = category.price * quantity;

    // Step 1: Create payment token
    const { token } = await safepay.payments.create({
      amount:   Math.round(totalAmount * 100),
      currency: 'PKR',
    });

    if (!token) throw new Error('No token returned from Safepay');

    // Step 2: Store pending purchase keyed by token
    const { error: insertError } = await supabase
      .from('pending_payments')
      .insert({
        tracker:      token,
        event_id:     eventId,
        category_id:  categoryId,
        quantity:     parseInt(quantity),
        buyer_name:   buyerName,
        buyer_email:  buyerEmail,
        buyer_phone:  buyerPhone || '',
        total_amount: totalAmount,
      });

    if (insertError) {
      console.error('Failed to store pending payment:', insertError);
      throw new Error('Failed to store pending payment');
    }

    // Step 3: Generate checkout URL
    const url = safepay.checkout.create({
      token,
      orderId:     token,
      cancelUrl:   `${process.env.CLIENT_URL}/events/${eventId}?cancelled=true`,
      redirectUrl: `${process.env.CLIENT_URL}/payment-success?tracker=${token}`,
      source:      'custom',
      webhooks:    true,
    });

    console.log('Checkout URL:', url);
    res.json({ tracker: token, url });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/webhook
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const payload = req.body;

    if (payload.type === 'payment.succeeded' && payload.data?.success === true) {
      const tracker = payload.data?.tracker?.token;
      const amount  = payload.data?.tracker?.purchase_totals?.quote_amount?.amount;

      const { data: pending, error: pendingError } = await supabase
        .from('pending_payments')
        .select('*')
        .eq('tracker', tracker)
        .single();

      if (pendingError || !pending) {
        console.error('Pending payment not found for tracker:', tracker);
        return res.json({ received: true });
      }

      const { event_id, category_id, quantity, buyer_name, buyer_email, buyer_phone, total_amount } = pending;

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          stripe_payment_id: tracker,
          stripe_session_id: tracker,
          buyer_name,
          buyer_email,
          buyer_phone,
          event_id,
          total_amount: amount ? amount / 100 : total_amount,
          status: 'completed'
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      const { data: cat } = await supabase
        .from('seat_categories')
        .select('sold_seats')
        .eq('id', category_id)
        .single();

      await supabase
        .from('seat_categories')
        .update({ sold_seats: cat.sold_seats + quantity })
        .eq('id', category_id);

      await supabase.from('pending_payments').delete().eq('tracker', tracker);

      generateTicketsAndSendEmails({
        purchaseId:  purchase.id,
        eventId:     event_id,
        categoryId:  category_id,
        quantity,
        buyerName:   buyer_name,
        buyerEmail:  buyer_email,
        buyerPhone:  buyer_phone,
        totalAmount: amount ? amount / 100 : total_amount
      }).catch(console.error);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/session/:tracker
router.get('/session/:tracker', async (req, res) => {
  console.log('session route hit, tracker:', req.params.tracker);
  try {
    const { data: pending } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('tracker', req.params.tracker)
      .single();

    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('stripe_payment_id', req.params.tracker)
      .single();

    const record = purchase || pending;

    res.json({
      status:        purchase ? 'TRACKER_ENDED' : 'TRACKER_STARTED',
      customerEmail: record?.buyer_email,
      amount:        record?.total_amount,
      metadata: {
        buyerName:  record?.buyer_name,
        buyerEmail: record?.buyer_email,
        eventId:    record?.event_id,
        quantity:   record?.quantity,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;