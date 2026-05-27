const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

// GET /api/tickets/purchase/:purchaseId — get all tickets for a purchase
router.get('/purchase/:purchaseId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (name, date, venue),
        seat_categories (name, price)
      `)
      .eq('purchase_id', req.params.purchaseId);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets/verify/:qrCode — scan ticket at entry gate
router.post('/verify/:qrCode', async (req, res) => {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (name, date, venue),
        seat_categories (name)
      `)
      .eq('qr_code', req.params.qrCode)
      .single();

    // QR code not found in DB
    if (error || !ticket) {
      return res.status(404).json({
        valid: false,
        message: '❌ Invalid ticket — QR code not recognised'
      });
    }

    // Already scanned
    if (ticket.scanned) {
      return res.status(200).json({
        valid: false,
        alreadyScanned: true,
        message: `❌ Ticket already scanned at ${new Date(ticket.scanned_at).toLocaleString('en-PK')}`,
        ticket: {
          buyerName: ticket.buyer_name,
          event:     ticket.events?.name,
          seat:      ticket.seat_number,
          category:  ticket.seat_categories?.name
        }
      });
    }

    // Valid — mark as scanned
    await supabase
      .from('tickets')
      .update({
        scanned:    true,
        scanned_at: new Date().toISOString()
      })
      .eq('id', ticket.id);

    res.json({
      valid: true,
      message: '✅ Ticket verified — welcome!',
      ticket: {
        buyerName: ticket.buyer_name,
        event:     ticket.events?.name,
        venue:     ticket.events?.venue,
        date:      ticket.events?.date,
        seat:      ticket.seat_number,
        category:  ticket.seat_categories?.name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;