const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key) return res.status(401).json({ error: 'Unauthorized' });

  if (key === process.env.ADMIN_SECRET_KEY) {
    req.role = 'admin';
    return next();
  }
  if (key === process.env.SCANNER_SECRET_KEY) {
    req.role = 'scanner';
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
};

const requireAdmin = (req, res, next) => {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

router.use(adminAuth);

// ============================================================
// ME — returns role so frontend knows what to show
// ============================================================
router.get('/me', (req, res) => {
  res.json({ role: req.role });
});

// ============================================================
// DASHBOARD — admin only
// ============================================================
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [eventsRes, purchasesRes, ticketsRes] = await Promise.all([
      supabase.from('events').select('id, name, is_active, date'),
      supabase.from('purchases').select('id, total_amount, status, event_id, created_at'),
      supabase.from('tickets').select('id, event_id, scanned')
    ]);

    const events    = eventsRes.data    || [];
    const purchases = purchasesRes.data || [];
    const tickets   = ticketsRes.data   || [];

    const totalRevenue = purchases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.total_amount), 0);

    const totalTickets   = tickets.length;
    const scannedTickets = tickets.filter(t => t.scanned).length;
    const activeEvents   = events.filter(e => e.is_active).length;

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
// EVENTS — admin only
// ============================================================
router.get('/events', requireAdmin, async (req, res) => {
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

router.post('/events', requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, date, venue, categories } = req.body;

    if (!name || !date || !venue) {
      return res.status(400).json({ error: 'name, date and venue are required' });
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({ name, description, image_url, date, venue })
      .select()
      .single();

    if (eventError) throw eventError;

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

router.put('/events/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, date, venue, is_active, categories } = req.body;

    const { error: eventError } = await supabase
      .from('events')
      .update({ name, description, image_url, date, venue, is_active })
      .eq('id', req.params.id);

    if (eventError) throw eventError;

    if (categories && categories.length > 0) {
      for (const cat of categories) {
        if (cat.id) {
          await supabase
            .from('seat_categories')
            .update({ name: cat.name, price: cat.price, total_seats: cat.total_seats })
            .eq('id', cat.id);
        } else {
          await supabase
            .from('seat_categories')
            .insert({ event_id: req.params.id, name: cat.name, price: cat.price, total_seats: cat.total_seats });
        }
      }
    }

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

router.patch('/events/:id/toggle', requireAdmin, async (req, res) => {
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

router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
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

router.delete('/events/:eventId/categories/:catId', requireAdmin, async (req, res) => {
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
// PURCHASES — admin only
// ============================================================
router.get('/purchases', requireAdmin, async (req, res) => {
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
// MANUAL SALE — admin creates a free / comp purchase
// ============================================================
router.post('/purchases/manual', requireAdmin, async (req, res) => {
  const { generateTicketsAndSendEmails } = require('../services/ticketService');

  try {
    const {
      eventId, categoryId, quantity,
      buyerName, buyerEmail, buyerPhone,
    } = req.body;

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

    // Insert a completed purchase with amount = 0
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        buyer_name:   buyerName,
        buyer_email:  buyerEmail,
        buyer_phone:  buyerPhone || '',
        event_id:     eventId,
        total_amount: 0,
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

    // Generate tickets and send email (non-blocking — errors logged)
    generateTicketsAndSendEmails({
      purchaseId:  purchase.id,
      eventId,
      categoryId,
      quantity:    parseInt(quantity),
      buyerName,
      buyerEmail,
      buyerPhone:  buyerPhone || '',
      totalAmount: 0,
    }).catch(console.error);

    res.status(201).json({ success: true, purchaseId: purchase.id });
  } catch (err) {
    console.error('Manual sale error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PORTFOLIO — admin only
// ============================================================
router.get('/portfolio', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/portfolio', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert(req.body)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/portfolio/:id', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('portfolio_items')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/portfolio/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;