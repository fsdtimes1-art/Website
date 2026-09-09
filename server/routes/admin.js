const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');
const { generateTicketsAndSendEmails } = require('../services/ticketService');

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key) return res.status(401).json({ error: 'Unauthorized' });

  if (key === process.env.ADMIN_SECRET_KEY) {
    req.role = 'admin';
    req.adminAccount = 'admin';
    return next();
  }
  if (key === process.env.ADMIN2_SECRET_KEY) {
    req.role = 'admin';
    req.adminAccount = 'admin2';
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
    const [eventsRes, purchasesRes, ticketsRes, physTicketRes] = await Promise.all([
      supabase.from('events').select('id, name, is_active, date'),
      supabase.from('purchases').select('id, total_amount, status, event_id, created_at'),
      supabase.from('tickets').select('id, event_id, scanned, voided'),
      supabase.from('physical_tickets').select('id, status, scanned, event_id'),
    ]);

    const events    = eventsRes.data    || [];
    const purchases = purchasesRes.data || [];
    const tickets   = ticketsRes.data   || [];
    const physTickets = physTicketRes.data || [];

    const totalRevenue = purchases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.total_amount), 0);

    // ── E-Ticket stats ──────────────────────────────────────
    const totalETickets   = tickets.length;
    const scannedETickets = tickets.filter(t => t.scanned).length;
    const voidedETickets  = tickets.filter(t => t.voided).length;
    const activeEvents    = events.filter(e => e.is_active).length;

    // ── Physical ticket stats ───────────────────────────────
    const totalPhysical   = physTickets.length;
    const activePhysical  = physTickets.filter(t => t.status === 'active').length;
    const scannedPhysical = physTickets.filter(t => t.scanned).length;
    const voidPhysical    = physTickets.filter(t => t.status === 'void').length;

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
      // E-Ticket section
      totalTickets:   totalETickets,
      scannedTickets: scannedETickets,
      voidedTickets:  voidedETickets,
      // Physical ticket section
      physicalTickets: {
        total:   totalPhysical,
        active:  activePhysical,
        scanned: scannedPhysical,
        voided:  voidPhysical,
        inactive: totalPhysical - activePhysical - voidPhysical,
      },
      // Events
      activeEvents,
      totalEvents:  events.length,
      eventStats,
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
    const [eventsRes, purchasesRes] = await Promise.all([
      supabase
        .from('events')
        .select('*, seat_categories(*)')
        .order('date', { ascending: false }),
      supabase
        .from('purchases')
        .select('event_id, total_amount, status')
        .eq('status', 'completed'),
    ]);

    if (eventsRes.error) throw eventsRes.error;
    if (purchasesRes.error) throw purchasesRes.error;

    const revenueByEvent = {};
    (purchasesRes.data || []).forEach(p => {
      revenueByEvent[p.event_id] = (revenueByEvent[p.event_id] || 0) + Number(p.total_amount);
    });

    const events = (eventsRes.data || []).map(e => ({
      ...e,
      revenue: revenueByEvent[e.id] || 0,
    }));

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/events', requireAdmin, async (req, res) => {
  try {
    const { name, description, image_url, date, venue, categories, discounts } = req.body;

    if (!name || !date || !venue) {
      return res.status(400).json({ error: 'name, date and venue are required' });
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({ name, description, image_url, date, venue, discounts: discounts || [] })
      .select()
      .single();

    if (eventError) throw eventError;

    if (categories && categories.length > 0) {
      const rows = categories.map(c => ({
        event_id:    event.id,
        name:        c.name,
        price:       c.price,
        service_fee: c.service_fee ?? 220,
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
    const { name, description, image_url, date, venue, is_active, categories, discounts } = req.body;

    const { error: eventError } = await supabase
      .from('events')
      .update({ name, description, image_url, date, venue, is_active, discounts: discounts || [] })
      .eq('id', req.params.id);

    if (eventError) throw eventError;

    if (categories && categories.length > 0) {
      for (const cat of categories) {
        if (cat.id) {
          await supabase
            .from('seat_categories')
            .update({ name: cat.name, price: cat.price, service_fee: cat.service_fee ?? 220, total_seats: cat.total_seats })
            .eq('id', cat.id);
        } else {
          await supabase
            .from('seat_categories')
            .insert({ event_id: req.params.id, name: cat.name, price: cat.price, service_fee: cat.service_fee ?? 220, total_seats: cat.total_seats });
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
    const { confirmationName } = req.body || {};
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, date, is_active')
      .eq('id', req.params.id)
      .single();

    if (eventError || !event) return res.status(404).json({ error: 'Event not found' });
    if (confirmationName !== event.name) {
      return res.status(400).json({ error: 'Type the exact event name to confirm permanent deletion' });
    }

    if (event.is_active || new Date(event.date) >= new Date()) {
      return res.status(400).json({ error: 'Only hidden past events can be permanently deleted' });
    }

    const { data, error } = await supabase
      .rpc('admin_delete_past_event', { p_event_id: req.params.id });

    if (error) throw error;
    res.json({ success: true, cleanup: Array.isArray(data) ? data[0] : data });
  } catch (err) {
    console.error('Delete past event error:', err);
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
        tickets (id, seat_number, scanned, seat_categories(name, price))
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

// POST /admin/purchases/manual — comp/manual ticket, no payment
router.post('/purchases/manual', requireAdmin, async (req, res) => {
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
    if (Number(quantity) > available) {
      return res.status(400).json({ error: `Only ${available} seat(s) available` });
    }

    // Create a completed purchase record (no payment — comp ticket)
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        buyer_name:   buyerName,
        buyer_email:  buyerEmail,
        buyer_phone:  buyerPhone || '',
        event_id:     eventId,
        total_amount: 0,
        status:       'completed',
        added_by:     req.adminAccount,
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Increment sold_seats
    const { error: seatError } = await supabase
      .from('seat_categories')
      .update({ sold_seats: category.sold_seats + Number(quantity) })
      .eq('id', categoryId);

    if (seatError) throw seatError;

    // Generate tickets, PDF, and send confirmation email
    const tickets = await generateTicketsAndSendEmails({
      purchaseId:  purchase.id,
      eventId,
      categoryId,
      quantity:    Number(quantity),
      buyerName,
      buyerEmail,
      buyerPhone:  buyerPhone || '',
      totalAmount: 0,
    });

    res.status(201).json({ ...purchase, tickets });
  } catch (err) {
    console.error('Manual sale error:', err);
    res.status(500).json({ error: err.message });
  }
});


// PATCH /admin/purchases/:id/verify-whatsapp
// Confirms a WhatsApp-based manual payment, mints tickets, sends emails.
router.patch('/purchases/:id/verify-whatsapp', requireAdmin, async (req, res) => {
  try {
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (purchaseError || !purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status !== 'whatsapp_pending') {
      return res.status(400).json({ error: 'Purchase is not pending WhatsApp verification' });
    }

    const { data: category, error: catError } = await supabase
      .from('seat_categories')
      .select('*')
      .eq('id', purchase.category_id)
      .single();

    if (catError || !category) {
      return res.status(404).json({ error: 'Seat category not found' });
    }

    const available = category.total_seats - category.sold_seats;
    if (purchase.quantity > available) {
      return res.status(400).json({ error: `Only ${available} seat(s) left — cannot verify this order` });
    }

    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'completed' })
      .eq('id', purchase.id);

    if (updateError) throw updateError;

    const { error: seatError } = await supabase
      .from('seat_categories')
      .update({ sold_seats: category.sold_seats + purchase.quantity })
      .eq('id', category.id);

    if (seatError) throw seatError;

    const tickets = await generateTicketsAndSendEmails({
      purchaseId:  purchase.id,
      eventId:     purchase.event_id,
      categoryId:  purchase.category_id,
      quantity:    purchase.quantity,
      buyerName:   purchase.buyer_name,
      buyerEmail:  purchase.buyer_email,
      buyerPhone:  purchase.buyer_phone || '',
      totalAmount: purchase.total_amount,
      ticketNames: purchase.ticket_names || [],
    });

    res.json({ ...purchase, status: 'completed', tickets });
  } catch (err) {
    console.error('Verify WhatsApp order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/purchases/:id
// Permanently removes an unverified WhatsApp-pending purchase only.
router.delete('/purchases/:id', requireAdmin, async (req, res) => {
  try {
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, status')
      .eq('id', req.params.id)
      .single();

    if (purchaseError || !purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status !== 'whatsapp_pending') {
      return res.status(400).json({ error: 'Only unverified WhatsApp-pending purchases can be deleted' });
    }

    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, scanned')
      .eq('purchase_id', purchase.id)
      .limit(1);

    if (ticketsError) throw ticketsError;
    if (tickets && tickets.length > 0) {
      return res.status(400).json({ error: 'Cannot delete a purchase with issued or scanned tickets' });
    }

    // Re-check status in the mutation to avoid deleting a purchase verified concurrently.
    const { data: deletedRows, error: deleteError } = await supabase
      .from('purchases')
      .delete()
      .eq('id', purchase.id)
      .eq('status', 'whatsapp_pending')
      .select('id');

    if (deleteError) throw deleteError;
    if (!deletedRows || deletedRows.length === 0) {
      return res.status(409).json({ error: 'Purchase was updated before deletion. Refresh and try again.' });
    }

    res.json({ success: true, id: purchase.id });
  } catch (err) {
    console.error('Delete WhatsApp purchase error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// VOID E-TICKET — admin only
// PATCH /admin/tickets/:id/void
// Voids a specific e-ticket (e.g. after customer refund).
// Only tickets that have NOT been scanned at the gate can be voided.
// ============================================================
router.patch('/tickets/:id/void', requireAdmin, async (req, res) => {
  try {
    const { data: ticket, error: fetchErr } = await supabase
      .from('tickets')
      .select('id, voided, scanned, buyer_name, seat_number, purchase_id')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.scanned) {
      return res.status(400).json({
        error: `Cannot void ticket ${ticket.seat_number} — it has already been scanned at the entry gate.`
      });
    }

    if (ticket.voided) {
      return res.status(400).json({ error: `Ticket ${ticket.seat_number} is already voided.` });
    }

    const { error: updateErr } = await supabase
      .from('tickets')
      .update({
        voided:    true,
        voided_at: new Date().toISOString(),
        voided_by: req.adminAccount || 'admin',
      })
      .eq('id', ticket.id);

    if (updateErr) throw updateErr;

    console.log(`⚠️ Ticket ${ticket.seat_number} (${ticket.buyer_name}) voided by ${req.adminAccount}`);
    res.json({ success: true, ticketId: ticket.id, seatNumber: ticket.seat_number });
  } catch (err) {
    console.error('Void ticket error:', err);
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
  const { client_name, event_name, description, image_url, event_date, attendees, is_featured } = req.body;
  const { data: latest } = await supabase
    .from('portfolio_items')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      client_name, event_name, description, image_url, event_date, attendees, is_featured,
      display_order: Number(latest?.display_order || 0) + 1,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/portfolio/order', requireAdmin, async (req, res) => {
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });

  const { data, error } = await supabase
    .rpc('admin_set_portfolio_order', { p_item_ids: orderedIds });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/portfolio/:id', requireAdmin, async (req, res) => {
  const { client_name, event_name, description, image_url, event_date, attendees, is_featured } = req.body;
  const { data, error } = await supabase
    .from('portfolio_items')
    .update({ client_name, event_name, description, image_url, event_date, attendees, is_featured })
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
