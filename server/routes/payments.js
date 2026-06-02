const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const supabase = require('../lib/supabase');
const { generateTicketsAndSendEmails } = require('../services/ticketService');

const VARIANT_ID = '1738929';

// POST /api/payments/create-checkout
// Called by EventDetail.jsx → createCheckout() in api.js
router.post('/create-checkout', async (req, res) => {
  try {
    const { eventId, categoryId, quantity, buyerName, buyerEmail, buyerPhone } = req.body;

    if (!eventId || !categoryId || !quantity || !buyerName || !buyerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate category & availability
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
      return res.status(400).json({ error: `Only ${available} seat(s) available` });
    }

    const totalAmount = category.price * quantity;

    // Create a pending purchase row first
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        stripe_payment_id: null,
        stripe_session_id: null,
        buyer_name:   buyerName,
        buyer_email:  buyerEmail,
        buyer_phone:  buyerPhone || '',
        event_id:     eventId,
        total_amount: totalAmount,
        status:       'pending',
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Create Lemon Squeezy checkout
    const lsResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept':        'application/vnd.api+json',
        'Content-Type':  'application/vnd.api+json',
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: buyerEmail,
              name:  buyerName,
              custom: {
                purchase_id:  purchase.id,
                event_id:     eventId,
                category_id:  categoryId,
                quantity:     String(quantity),
                buyer_name:   buyerName,
                buyer_email:  buyerEmail,
                buyer_phone:  buyerPhone || '',
                total_amount: String(totalAmount),
              },
            },
            product_options: {
              name:         `${category.events.name} — ${category.name}`,
              redirect_url: `${process.env.CLIENT_URL}/payment-success?purchaseId=${purchase.id}`,
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: String(process.env.LEMONSQUEEZY_STORE_ID) },
            },
            variant: {
              data: { type: 'variants', id: VARIANT_ID },
            },
          },
        },
      }),
    });

    const lsData = await lsResponse.json();

    if (!lsResponse.ok) {
      console.error('Lemon Squeezy error:', JSON.stringify(lsData));
      // Clean up the pending purchase
      await supabase.from('purchases').delete().eq('id', purchase.id);
      return res.status(500).json({ error: 'Could not create payment link' });
    }

    const checkoutUrl = lsData.data.attributes.url;

    res.json({ checkoutUrl });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET /api/payments/session/:id
// Called by PaymentSuccess.jsx → getPaymentSession()
router.get('/session/:id', async (req, res) => {
  try {
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.json({
      status:        purchase.status === 'completed' ? 'COMPLETED' : 'PENDING',
      customerEmail: purchase.buyer_email,
      amount:        purchase.total_amount,
      metadata: {
        purchaseId: purchase.id,
        buyerName:  purchase.buyer_name,
        buyerEmail: purchase.buyer_email,
        eventId:    purchase.event_id,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/payments/webhook
// Lemon Squeezy calls this after payment is confirmed
// Must be registered BEFORE express.json() in index.js
router.post('/webhook', async (req, res) => {
  const secret    = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];

  if (!signature) {
    return res.status(401).json({ error: 'No signature' });
  }

  const hmac   = crypto.createHmac('sha256', secret);
  const digest = hmac.update(req.body).digest('hex');

  if (digest !== signature) {
    console.warn('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventName  = payload.meta?.event_name;
  const orderData  = payload.data?.attributes;
  const customData = payload.meta?.custom_data;

  if (eventName === 'order_created' && orderData?.status === 'paid') {
    const {
      purchase_id,
      event_id,
      category_id,
      quantity,
      buyer_name,
      buyer_email,
      buyer_phone,
      total_amount,
    } = customData || {};

    // Mark purchase as completed
    await supabase
      .from('purchases')
      .update({
        status:            'completed',
        stripe_payment_id: String(payload.data.id),
      })
      .eq('id', purchase_id);

    // Increment sold_seats
    const { data: category } = await supabase
      .from('seat_categories')
      .select('sold_seats')
      .eq('id', category_id)
      .single();

    if (category) {
      await supabase
        .from('seat_categories')
        .update({ sold_seats: category.sold_seats + parseInt(quantity) })
        .eq('id', category_id);
    }

    // Generate tickets & send emails (non-blocking)
    generateTicketsAndSendEmails({
      purchaseId:  purchase_id,
      eventId:     event_id,
      categoryId:  category_id,
      quantity:    parseInt(quantity),
      buyerName:   buyer_name,
      buyerEmail:  buyer_email,
      buyerPhone:  buyer_phone || '',
      totalAmount: parseInt(total_amount),
    }).catch(console.error);
  }

  res.status(200).json({ received: true });
});

module.exports = router;