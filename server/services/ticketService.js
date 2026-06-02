const { v4: uuidv4 }          = require('uuid');
const supabase                 = require('../lib/supabase');
const { generateTicketPDF }    = require('./pdfService');
const { sendTicketEmail } = require('./emailService');

/**
 * Full ticket generation flow:
 * 1. Generate unique QR token + seat number per ticket
 * 2. Insert ticket rows into DB
 * 3. Build PDF with all tickets
 * 4. Send ticket PDF email
 */
async function generateTicketsAndSendEmails({
  purchaseId,
  eventId,
  categoryId,
  quantity,
  buyerName,
  buyerEmail,
  buyerPhone,
  totalAmount
}) {
  // ── Fetch event and category ────────────────────────────────
  const { data: category, error: catError } = await supabase
    .from('seat_categories')
    .select('*, events(*)')
    .eq('id', categoryId)
    .single();

  if (catError || !category) {
    throw new Error(`Category not found: ${categoryId}`);
  }

  const event = category.events;

  // ── Work out next seat number ───────────────────────────────
  // Count existing tickets for this category to get starting number
  const { count } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('seat_category_id', categoryId);

  const prefix  = category.name.toUpperCase().replace(/\s+/g, '').substring(0, 4);
  let   nextNum = (count || 0) + 1;

  // ── Create ticket rows ──────────────────────────────────────
  const ticketRows = [];

  for (let i = 0; i < quantity; i++) {
    ticketRows.push({
      purchase_id:      purchaseId,
      event_id:         eventId,
      seat_category_id: categoryId,
      seat_number:      `${prefix}-${String(nextNum + i).padStart(3, '0')}`,
      buyer_name:       buyerName,
      buyer_email:      buyerEmail,
      buyer_phone:      buyerPhone || null,
      qr_code:          uuidv4()   // unique token stored in DB and embedded in QR
    });
  }

  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .insert(ticketRows)
    .select();

  if (ticketError) throw ticketError;

  // ── Generate PDF ────────────────────────────────────────────
  const pdfBuffer = await generateTicketPDF(tickets, event, category);

  // ── Send email: ticket PDF ────────────────────────────────
  await sendTicketEmail({
    buyerEmail,
    buyerName,
    eventName: event.name,
    tickets,
    pdfBuffer
  });

  console.log(`✅ ${quantity} ticket(s) generated and emailed to ${buyerEmail}`);
  return tickets;
}

module.exports = { generateTicketsAndSendEmails };