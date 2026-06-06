// server/services/reminderScheduler.js
const cron = require('node-cron');
const { sendEventReminder } = require('./emailService');
const supabase = require('../lib/supabase');

// Runs every day at 10:00 AM
cron.schedule('0 10 * * *', async () => {
  console.log('[Reminder Job] Running...');

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    // Get all confirmed purchases where the event is tomorrow
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        id,
        buyer_name,
        buyer_email,
        total_amount,
        event_id,
        events ( name, date, venue ),
        tickets ( seat_category_id, seat_categories ( name ) )
      `)
      .eq('status', 'confirmed')
      .gte('events.date', `${dateStr}T00:00:00+00:00`)
      .lt('events.date',  `${dateStr}T23:59:59+00:00`);

    if (error) throw error;

    // Filter out purchases whose event isn't actually tomorrow
    // (Supabase foreign table filters don't exclude rows, so we filter manually)
    const due = (purchases || []).filter(p => {
      if (!p.events?.date) return false;
      const eventDate = new Date(p.events.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });

    if (!due.length) {
      console.log('[Reminder Job] No events tomorrow.');
      return;
    }

    for (const p of due) {
      // Count tickets for this purchase
      const quantity = p.tickets?.length || 1;

      // Get category name from first ticket
      const categoryName = p.tickets?.[0]?.seat_categories?.name || 'General';

      await sendEventReminder({
        buyerEmail:   p.buyer_email,
        buyerName:    p.buyer_name,
        eventName:    p.events.name,
        eventDate:    p.events.date,
        eventVenue:   p.events.venue,
        quantity,
        categoryName,
        purchaseId:   p.id,
      });

      console.log(`[Reminder Job] Sent to ${p.buyer_email} for "${p.events.name}"`);
    }

    console.log(`[Reminder Job] Done. ${due.length} reminder(s) sent.`);
  } catch (err) {
    console.error('[Reminder Job] Failed:', err);
  }
});