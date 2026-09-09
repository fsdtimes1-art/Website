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
// Handles BOTH online UUID tickets (from purchases) and physical PT-... tickets.
// Uses the admin_verify_ticket_by_qr RPC for atomic, race-condition-safe scanning.
router.post('/verify/:qrCode', async (req, res) => {
  try {
    const qrCode = req.params.qrCode.trim();

    if (!qrCode) {
      return res.status(400).json({ valid: false, message: '❌ No QR code provided' });
    }

    const { data, error } = await supabase
      .rpc('admin_verify_ticket_by_qr', { p_qr: qrCode });

    if (error) {
      console.error('Verify ticket RPC error:', error);
      return res.status(500).json({ error: error.message });
    }

    // The RPC returns a JSONB object matching the frontend result shape:
    // { valid: bool, message: string, alreadyScanned?: bool, ticket?: {...} }
    return res.json(data);
  } catch (err) {
    console.error('Verify ticket error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;