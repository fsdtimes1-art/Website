const nodemailer = require('nodemailer');



const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `${process.env.FROM_NAME || 'EventFlow'} <${process.env.FROM_EMAIL}>`;

// ============================================================
// EMAIL 1 — Payment Confirmation
// ============================================================
async function sendPaymentConfirmation({
  buyerEmail,
  buyerName,
  eventName,
  eventDate,
  eventVenue,
  quantity,
  categoryName,
  totalAmount,
  purchaseId
}) {
  const formattedDate = new Date(eventDate).toLocaleDateString('en-PK', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit'
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px 16px; }
    .wrap { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
    .header { background: #0a0a0a; padding: 36px 32px; text-align: center; }
    .header h1 { color: #f59e0b; font-size: 26px; letter-spacing: 5px; margin-bottom: 6px; }
    .header p { color: #9ca3af; font-size: 13px; }
    .badge { display: inline-block; background: #f59e0b; color: #000; font-size: 11px; font-weight: 700; padding: 6px 18px; border-radius: 20px; margin-top: 14px; }
    .body { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #111; margin-bottom: 6px; }
    .subtitle { color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
    .card { background: #f9fafb; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
    .card-label { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; }
    .card-value { font-size: 15px; font-weight: 600; color: #111; }
    .total-row { background: #0a0a0a; border-radius: 8px; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .total-label { color: #9ca3af; font-size: 14px; }
    .total-value { color: #f59e0b; font-size: 24px; font-weight: 700; }
    .notice { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin-top: 20px; font-size: 13px; color: #92400e; line-height: 1.5; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>EVENTFLOW</h1>
      <p>Professional Event Management</p>
      <span class="badge">✓ BOOKING CONFIRMED</span>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${buyerName}!</p>
      <p class="subtitle">Your booking is confirmed. Your ticket PDF with QR code(s) will arrive in a separate email shortly.</p>
      <div class="card"><div class="card-label">Event</div><div class="card-value">${eventName}</div></div>
      <div class="card"><div class="card-label">Date & Time</div><div class="card-value">${formattedDate}</div></div>
      <div class="card"><div class="card-label">Venue</div><div class="card-value">${eventVenue}</div></div>
      <div class="card"><div class="card-label">Category</div><div class="card-value">${categoryName}</div></div>
      <div class="card"><div class="card-label">Quantity</div><div class="card-value">${quantity} ticket${quantity > 1 ? 's' : ''}</div></div>
      <div class="total-row">
        <span class="total-label">Total</span>
        <span class="total-value">PKR ${Number(totalAmount).toLocaleString()}</span>
      </div>
      <div class="notice">🎟️ Your ticket PDF is on its way in a second email. Present the QR code at the venue entrance.</div>
      <p style="font-size:11px;color:#d1d5db;margin-top:16px">Order Reference: ${purchaseId}</p>
    </div>
    <div class="footer"><p><strong>EventFlow</strong> — Professional Event Management</p></div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    FROM,
    to:      buyerEmail,
    subject: `✅ Booking Confirmed — ${eventName}`,
    html,
  });
}

// ============================================================
// EMAIL 2 — Ticket with PDF attachment
// ============================================================
async function sendTicketEmail({
  buyerEmail,
  buyerName,
  eventName,
  tickets,
  pdfBuffer
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px 16px; }
    .wrap { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
    .header { background: #0a0a0a; padding: 36px 32px; text-align: center; }
    .header h1 { color: #f59e0b; font-size: 26px; letter-spacing: 5px; }
    .body { padding: 36px 32px; }
    .icon { font-size: 52px; text-align: center; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 700; color: #111; text-align: center; margin-bottom: 8px; }
    .subtitle { color: #6b7280; font-size: 14px; text-align: center; line-height: 1.5; margin-bottom: 28px; }
    .ticket-row { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
    .ticket-row:last-child { border-bottom: none; }
    .seat { font-weight: 700; color: #111; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header"><h1>EVENTFLOW</h1></div>
    <div class="body">
      <div class="icon">🎟️</div>
      <div class="title">Your Ticket${tickets.length > 1 ? 's Are' : ' Is'} Here!</div>
      <div class="subtitle">Hi ${buyerName}, your ticket${tickets.length > 1 ? 's are' : ' is'} attached as a PDF.</div>
      <div style="border-radius:8px;overflow:hidden;margin-bottom:28px">
        ${tickets.map(t => `<div class="ticket-row"><span class="seat">${t.seat_number}</span><span style="color:#6b7280">${eventName}</span></div>`).join('')}
      </div>
      <p style="font-size:13px;color:#374151;line-height:1.6">Open the attached PDF, save it to your phone or print it, and show the QR code at the entrance. Each QR code is valid for one scan only.</p>
    </div>
    <div class="footer"><p><strong>EventFlow</strong> — Professional Event Management</p></div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    FROM,
    to:      buyerEmail,
    subject: `🎟️ Your Tickets — ${eventName}`,
    html,
    attachments: [{
      filename: `tickets-${eventName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      content:  pdfBuffer,
    }],
  });
}

// ============================================================
// EMAIL 3 — Event Reminder (1 day before)
// ============================================================
async function sendEventReminder({
  buyerEmail,
  buyerName,
  eventName,
  eventDate,
  eventVenue,
  quantity,
  categoryName,
  purchaseId
}) {
  const formattedDate = new Date(eventDate).toLocaleDateString('en-PK', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit'
  });

  const formattedTime = new Date(eventDate).toLocaleTimeString('en-PK', {
    hour:   '2-digit',
    minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px 16px; }
    .wrap { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
    .header { background: #0a0a0a; padding: 36px 32px; text-align: center; }
    .header h1 { color: #f59e0b; font-size: 26px; letter-spacing: 5px; margin-bottom: 6px; }
    .header p { color: #9ca3af; font-size: 13px; }
    .badge { display: inline-block; background: #ef4444; color: #fff; font-size: 11px; font-weight: 700; padding: 6px 18px; border-radius: 20px; margin-top: 14px; letter-spacing: 1px; }
    .body { padding: 32px; }
    .countdown-box { background: #0a0a0a; border-radius: 10px; padding: 22px; text-align: center; margin-bottom: 24px; }
    .countdown-label { color: #9ca3af; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
    .countdown-value { color: #f59e0b; font-size: 32px; font-weight: 700; letter-spacing: 1px; }
    .countdown-sub { color: #6b7280; font-size: 13px; margin-top: 4px; }
    .greeting { font-size: 18px; font-weight: 600; color: #111; margin-bottom: 6px; }
    .subtitle { color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
    .card { background: #f9fafb; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
    .card-label { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; }
    .card-value { font-size: 15px; font-weight: 600; color: #111; }
    .checklist { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 18px; margin-top: 20px; }
    .checklist-title { font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 10px; }
    .checklist-item { font-size: 13px; color: #166534; line-height: 1.7; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>EVENTFLOW</h1>
      <p>Professional Event Management</p>
      <span class="badge">⏰ TOMORROW'S THE DAY</span>
    </div>
    <div class="body">
      <div class="countdown-box">
        <div class="countdown-label">Event starts in</div>
        <div class="countdown-value">24 Hours</div>
        <div class="countdown-sub">${formattedTime} tomorrow</div>
      </div>
      <p class="greeting">See you tomorrow, ${buyerName}!</p>
      <p class="subtitle">Just a friendly reminder that <strong>${eventName}</strong> is happening tomorrow. Make sure you have your ticket ready!</p>
      <div class="card"><div class="card-label">Event</div><div class="card-value">${eventName}</div></div>
      <div class="card"><div class="card-label">Date & Time</div><div class="card-value">${formattedDate}</div></div>
      <div class="card"><div class="card-label">Venue</div><div class="card-value">${eventVenue}</div></div>
      <div class="card"><div class="card-label">Category</div><div class="card-value">${categoryName}</div></div>
      <div class="card"><div class="card-label">Quantity</div><div class="card-value">${quantity} ticket${quantity > 1 ? 's' : ''}</div></div>
      <div class="checklist">
        <div class="checklist-title">✅ Pre-Event Checklist</div>
        <div class="checklist-item">🎟️ Save your ticket PDF to your phone or print it</div>
        <div class="checklist-item">📍 Check the venue location in advance</div>
        <div class="checklist-item">🕐 Arrive a few minutes early to avoid queues</div>
        <div class="checklist-item">📵 Have your QR code ready to scan at the gate</div>
      </div>
      <p style="font-size:11px;color:#d1d5db;margin-top:16px">Order Reference: ${purchaseId}</p>
    </div>
    <div class="footer"><p><strong>EventFlow</strong> — Professional Event Management</p></div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    FROM,
    to:      buyerEmail,
    subject: `⏰ Reminder: ${eventName} is Tomorrow!`,
    html,
  });
}

module.exports = { sendPaymentConfirmation, sendTicketEmail, sendEventReminder };
