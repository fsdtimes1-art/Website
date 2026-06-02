const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const supabase = require('../lib/supabase');
const { generateTicketsAndSendEmails } = require('../services/ticketService');

const VARIANT_ID = '1738929';

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
      return res.status(400).json({ error: `Only ${available} seat(s) available` });
    }

    const totalAmount = category.price * quantity;

    // Save pending purchase first so we have an ID for the redirect URL
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
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

    // Create Lemon Squeezy checkout session
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
            custom_price: totalAmount * 100,
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
            checkout_options: {
              embed: true,
            },
            product_options: {
              name: `${category.events.name} — ${category.name}`,
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
      // Log the real error so you can see it in server logs
      console.error('Lemon Squeezy error:', JSON.stringify(lsData, null, 2));
      // Clean up the pending purchase
      await supabase.from('purchases').delete().eq('id', purchase.id);
      // Return the actual LS error message to help debug
      const lsError = lsData?.errors?.[0]?.detail || 'Could not create payment link';
      return res.status(500).json({ error: lsError });
    }

    const checkoutUrl = lsData.data.attributes.url;
    res.json({ checkoutUrl, purchaseId: purchase.id });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET /api/payments/session/:id — used by PaymentSuccess page
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
// Lemon Squeezy calls this after payment — needs raw body (set in index.js)
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
      purchase_id, event_id, category_id,
      quantity, buyer_name, buyer_email, buyer_phone, total_amount,
    } = customData || {};

    // Mark purchase completed
    await supabase
      .from('purchases')
      .update({
        status:            'completed',
        stripe_payment_id: String(payload.data.id),
      })
      .eq('id', purchase_id);

    // Increment sold_seats
    const { data: cat } = await supabase
      .from('seat_categories')
      .select('sold_seats')
      .eq('id', category_id)
      .single();

    if (cat) {
      await supabase
        .from('seat_categories')
        .update({ sold_seats: cat.sold_seats + parseInt(quantity) })
        .eq('id', category_id);
    }

    // Generate tickets & send emails
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