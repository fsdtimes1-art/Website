const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');
const { generateTicketsAndSendEmails } = require('../services/ticketService');

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

    // Create purchase immediately as completed
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        stripe_payment_id: `direct_${Date.now()}`,
        stripe_session_id: null,
        buyer_name:   buyerName,
        buyer_email:  buyerEmail,
        buyer_phone:  buyerPhone || '',
        event_id:     eventId,
        total_amount: totalAmount,
        status:       'completed',
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Increment sold_seats
    await supabase
      .from('seat_categories')
      .update({ sold_seats: category.sold_seats + parseInt(quantity) })
      .eq('id', categoryId);

    // Fire emails in background (non-blocking)
    generateTicketsAndSendEmails({
      purchaseId:  purchase.id,
      eventId,
      categoryId,
      quantity:    parseInt(quantity),
      buyerName,
      buyerEmail,
      buyerPhone:  buyerPhone || '',
      totalAmount,
    }).catch(err => console.error('Ticket generation error:', err));

    res.json({
      success:    true,
      purchaseId: purchase.id,
    });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/session/:id — used by success page
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
      status:        'COMPLETED',
      customerEmail: purchase.buyer_email,
      amount:        purchase.total_amount,
      metadata: {
        buyerName:  purchase.buyer_name,
        buyerEmail: purchase.buyer_email,
        eventId:    purchase.event_id,
        purchaseId: purchase.id,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;