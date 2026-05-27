const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

// GET /api/events — all active events with their seat categories
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        seat_categories (*)
      `)
      .eq('is_active', true)
      .order('date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id — single active event with seat categories
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        seat_categories (*)
      `)
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Event not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;