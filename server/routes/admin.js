const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

// ============================================================
// AUTH MIDDLEWARE
// Checks x-admin-key header on every admin request
// ============================================================
const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.use(adminAuth);

// ============================================================
// DASHBOARD
// ============================================================

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [eventsRes, purchasesRes, ticketsRes] = await Promise.all([
      supabase.from('events').select('id, name, is_active, date'),
      supabase.from('purchases').select('id, total_amount, status, event_id, created_at'),
      supabase.from('tickets').select('id, event_id, scanned')
    ]);

    const events    = eventsRes.data    || [];
    const purchases = purchasesRes.data || [];
    const tickets   = ticketsRes.data   || [];

    // Total revenue from completed purchases
    const totalRevenue = purchases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.total_amount), 0);

    const totalTickets   = tickets.length;
    const scannedTickets = tickets.filter(t => t.scanned).length;
    const activeEvents   = events.filter(e => e.is_active).length;

    // Revenue + ticket count per event
    const revenueByEvent = {};
    purchases
      .filter(p => p.status === 'completed')
      .forEach(p => {
        revenueByEvent[p.event_id] = (revenueByEvent[p.event_id] || 0) + Number(p.total_amount);
      });

    const eventStats = events.map(e => ({
      ...e,
      revenue:      revenueByEvent[e.id] || 0,
      tickets_sold: tickets.filter(t => t.event_id === e.id).length
    }));

    res.json({
      totalRevenue,
      totalTickets,
      scannedTickets,
      activeEvents,
      totalEvents: events.length,
      eventStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// EVENTS
// ============================================================

// GET /api/admin/events — ALL events including hidden ones
router.get('/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, seat_categories(*)')
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/events — create new event with seat categories
router.post('/events', async (req, res) => {
  try {
    const { name, description, image_url, date, venue, categories } = req.body;

    if (!name || !date || !venue) {
      return res.status(400).json({ error: 'name, date and venue are required' });
    }

    // Insert event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({ name, description, image_url, date, venue })
      .select()
      .single();

    if (eventError) throw eventError;

    // Insert seat categories if provided
    if (categories && categories.length > 0) {
      const rows = categories.map(c => ({
        event_id:    event.id,
        name:        c.name,
        price:       c.price,
        total_seats: c.total_seats
      }));

      const { error: catError } = await supabase
        .from('seat_categories')
        .insert(rows);

      if (catError) throw catError;
    }

    // Return full event with categories
    const { data: full } = await supabase
      .from('events')
      .select('*, seat_categories(*)')
      .eq('id', event.id)
      .single();

    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/events/:id — update event details and categories
router.put('/events/:id', async (req, res) => {
  try {
    const { name, description, image_url, date, venue, is_active, categories } = req.body;

    // Update event
    const { error: eventError } = await supabase
      .from('events')
      .update({ name, description, image_url, date, venue, is_active })
      .eq('id', req.params.id);

    if (eventError) throw eventError;

    // Update or insert categories
    if (categories && categories.length > 0) {
      for (const cat of categories) {
        if (cat.id) {
          // Existing category — update
          await supabase
            .from('seat_categories')
            .update({
              name:        cat.name,
              price:       cat.price,
              total_seats: cat.total_seats
            })
            .eq('id', cat.id);
        } else {
          // New category — insert
          await supabase
            .from('seat_categories')
            .insert({
              event_id:    req.params.id,
              name:        cat.name,
              price:       cat.price,
              total_seats: cat.total_seats
            });
        }
      }
    }

    // Return updated event
    const { data: full } = await supabase
      .from('events')
      .select('*, seat_categories(*)')
      .eq('id', req.params.id)
      .single();

    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/events/:id/toggle — show/hide event
router.patch('/events/:id/toggle', async (req, res) => {
  try {
    const { data: event } = await supabase
      .from('events')
      .select('is_active')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('events')
      .update({ is_active: !event.is_active })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/events/:id — hard delete
// Only use for events with no purchases; otherwise use toggle
router.delete('/events/:id', async (req, res) => {
  try {
    // Check if any purchases exist
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id')
      .eq('event_id', req.params.id)
      .limit(1);

    if (purchases && purchases.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete event with existing purchases. Use toggle to hide it instead.'
      });
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/events/:eventId/categories/:catId — remove a seat category
router.delete('/events/:eventId/categories/:catId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('seat_categories')
      .delete()
      .eq('id', req.params.catId)
      .eq('event_id', req.params.eventId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PURCHASES / TICKET BUYERS
// ============================================================

// GET /api/admin/purchases?eventId=xxx
router.get('/purchases', async (req, res) => {
  try {
    const { eventId } = req.query;

    let query = supabase
      .from('purchases')
      .select(`
        *,
        events (name, date, venue),
        tickets (id, seat_number, scanned, seat_categories(name))
      `)
      .order('created_at', { ascending: false });

    if (eventId) query = query.eq('event_id', eventId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PORTFOLIO
// ============================================================

// GET /api/admin/portfolio
router.get('/portfolio', async (req, res) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/admin/portfolio
router.post('/portfolio', async (req, res) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert(req.body)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/admin/portfolio/:id
router.put('/portfolio/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/admin/portfolio/:id
router.delete('/portfolio/:id', async (req, res) => {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;