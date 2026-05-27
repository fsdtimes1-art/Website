const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

// GET /api/portfolio — all portfolio items ordered by display_order
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;