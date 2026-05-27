const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = `${process.env.FROM_NAME || 'EventFlow'} <${process.env.FROM_EMAIL || 'tickets@eventflow.com'}>`;

// ============================================================
// EMAIL 1 — Payment Confirmation (no attachment)
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
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #f4f4f5;
      padding: 32px 16px;
    }
    .wrap {
      max-width: 560px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: #0a0a0a;
      padding: 36px 32px;
      text-align: center;
    }
    .header h1 {
      color: #f59e0b;
      font-size: 26px;
      letter-spacing: 5px;
      margin-bottom: 6px;
    }
    .header p {
      color: #9ca3af;
      font-size: 13px;
    }
    .badge {
      display: inline-block;
      background: #f59e0b;
      color: #000;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 6px 18px;
      border-radius: 20px;
      margin-top: 14px;
    }
    .body { padding: 32px; }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #111;
      margin-bottom: 6px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 10px;
    }
    .card-label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .card-value {
      font-size: 15px;
      font-weight: 600;
      color: #111;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .total-row {
      background: #0a0a0a;
      border-radius: 8px;
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }
    .total-label { color: #9ca3af; font-size: 14px; }
    .total-value { color: #f59e0b; font-size: 24px; font-weight: 700; }
    .notice {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 20px;
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
    }
    .ref {
      font-size: 11px;
      color: #d1d5db;
      margin-top: 16px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.7;
      border-top: 1px solid #f3f4f6;
    }
  </style>
</head>
<body>
  <div class="wrap">

    <div class="header">
      <h1>EVENTFLOW</h1>
      <p>Professional Event Management</p>
      <span class="badge">✓ PAYMENT SUCCESSFUL</span>
    </div>

    <div class="body">
      <p class="greeting">Hello, ${buyerName}!</p>
      <p class="subtitle">
        Your payment was processed successfully. Your ticket PDF with QR code(s)
        will arrive in a separate email within the next few minutes.
      </p>

      <div class="card">
        <div class="card-label">Event</div>
        <div class="card-value">${eventName}</div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-label">Date &amp; Time</div>
          <div class="card-value" style="font-size:13px">${formattedDate}</div>
        </div>
        <div class="card">
          <div class="card-label">Venue</div>
          <div class="card-value" style="font-size:13px">${eventVenue}</div>
        </div>
        <div class="card">
          <div class="card-label">Category</div>
          <div class="card-value">${categoryName}</div>
        </div>
        <div class="card">
          <div class="card-label">Quantity</div>
          <div class="card-value">${quantity} ticket${quantity > 1 ? 's' : ''}</div>
        </div>
      </div>

      <div class="total-row">
        <span class="total-label">Total Paid</span>
        <span class="total-value">PKR ${Number(totalAmount).toLocaleString()}</span>
      </div>

      <div class="notice">
        🎟️ Your ticket PDF with QR code(s) is on its way in a second email.
        Please present the QR code at the venue entrance. Each QR code is valid
        for one scan only — do not share it.
      </div>

      <p class="ref">Order Reference: ${purchaseId}</p>
    </div>

    <div class="footer">
      <p><strong>EventFlow</strong> — Professional Event Management</p>
      <p>Questions? Reply to this email or reach us on WhatsApp.</p>
    </div>

  </div>
</body>
</html>`;

  await resend.emails.send({
    from:    FROM,
    to:      buyerEmail,
    subject: `✅ Payment Confirmed — ${eventName}`,
    html
  });
}

// ============================================================
// EMAIL 2 — Ticket Email with PDF Attachment
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
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #f4f4f5;
      padding: 32px 16px;
    }
    .wrap {
      max-width: 560px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: #0a0a0a;
      padding: 36px 32px;
      text-align: center;
    }
    .header h1 {
      color: #f59e0b;
      font-size: 26px;
      letter-spacing: 5px;
    }
    .body { padding: 36px 32px; }
    .icon { font-size: 52px; text-align: center; margin-bottom: 16px; }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #111;
      text-align: center;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      text-align: center;
      line-height: 1.5;
      margin-bottom: 28px;
    }
    .ticket-list {
      background: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 28px;
    }
    .ticket-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    .ticket-row:last-child { border-bottom: none; }
    .seat {
      font-weight: 700;
      color: #111;
      font-size: 14px;
    }
    .event-label {
      color: #6b7280;
      font-size: 13px;
    }
    .steps { margin-bottom: 8px; }
    .steps-title {
      font-size: 14px;
      font-weight: 700;
      color: #111;
      margin-bottom: 14px;
    }
    .step {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: flex-start;
    }
    .step-num {
      background: #f59e0b;
      color: #000;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.5;
    }
    .footer {
      background: #f9fafb;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.7;
      border-top: 1px solid #f3f4f6;
    }
  </style>
</head>
<body>
  <div class="wrap">

    <div class="header">
      <h1>EVENTFLOW</h1>
    </div>

    <div class="body">
      <div class="icon">🎟️</div>
      <div class="title">Your Ticket${tickets.length > 1 ? 's Are' : ' Is'} Here!</div>
      <div class="subtitle">
        Hi ${buyerName}, your ticket${tickets.length > 1 ? 's are' : ' is'} attached
        to this email as a PDF. Open or download the attachment below.
      </div>

      <div class="ticket-list">
        ${tickets.map(t => `
          <div class="ticket-row">
            <span class="seat">${t.seat_number}</span>
            <span class="event-label">${eventName}</span>
          </div>
        `).join('')}
      </div>

      <div class="steps">
        <p class="steps-title">How to use your ticket:</p>

        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">
            Open or download the attached PDF file.
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">
            Save it to your phone or print it — both are accepted at the venue.
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">
            Show the QR code to staff at the entrance gate for scanning.
          </div>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <div class="step-text">
            Each QR code allows entry once only. Do not share your ticket.
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>EventFlow</strong> — Professional Event Management</p>
      <p>Need help? Reply to this email or contact us on WhatsApp.</p>
    </div>

  </div>
</body>
</html>`;

  await resend.emails.send({
    from:    FROM,
    to:      buyerEmail,
    subject: `🎟️ Your Tickets — ${eventName}`,
    html,
    attachments: [
      {
        filename: `tickets-${eventName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        content:  pdfBuffer.toString('base64')
      }
    ]
  });
}

module.exports = { sendPaymentConfirmation, sendTicketEmail };