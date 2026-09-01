const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');

/**
 * Generates a PDF buffer containing one page per ticket.
 * Each page has event info, buyer details, seat number, and a QR code.
 *
 * @param {Array}  tickets  - array of ticket rows from DB
 * @param {Object} event    - event row
 * @param {Object} category - seat_category row
 * @returns {Promise<Buffer>}
 */
async function generateTicketPDF(tickets, event, category) {
  return new Promise(async (resolve, reject) => {
    try {
      // Ticket size: standard boarding-pass proportions
      const doc = new PDFDocument({
        size:    [595, 280],
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });

      const chunks = [];
      doc.on('data',  chunk => chunks.push(chunk));
      doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];

        if (i > 0) doc.addPage();

        // Ticket background
        doc.rect(0, 0, 595, 280).fill('#0a0a0a');

        // Faisalabad Times accent bar
        doc.rect(0, 0, 6, 280).fill('#29dcff');

        // Top header band
        doc.rect(6, 0, 589, 58).fill('#111111');

        // Company name
        doc
          .fillColor('#29dcff')
          .font('Helvetica-Bold')
          .fontSize(18)
          .text('FAISALABAD TIMES', 22, 19);

        // Confirmed badge (top right)
        doc.roundedRect(418, 10, 160, 36, 4).fill('#29dcff');
        doc
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('TICKET CONFIRMED', 426, 22);

        // Event name
        doc
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(20)
          .text(event.name, 22, 72, { width: 350 });

        // Date and venue
        const dateStr = new Date(event.date).toLocaleDateString('en-PK', {
          timeZone: 'Asia/Karachi',
          weekday: 'long',
          year:    'numeric',
          month:   'long',
          day:     'numeric',
          hour:    '2-digit',
          minute:  '2-digit'
          hour12:   true
        });

        doc
          .fillColor('#9ca3af')
          .font('Helvetica')
          .fontSize(9.5);

        doc.text(`  ${dateStr}`,  22, 128);
        doc.text(`  ${event.venue}`, 22, 144);

        // Ticket detail boxes
        const boxY  = 170;
        const boxes = [
          { label: 'PASSENGER',  value: ticket.buyer_name },
          { label: 'CATEGORY',   value: category.name },
          { label: 'SEAT NO.',   value: ticket.seat_number },
          { label: 'PRICE',      value: `PKR ${Number(category.price).toLocaleString()}` }
        ];

        boxes.forEach((box, idx) => {
          const x = 22 + idx * 103;

          // Box background
          doc.rect(x, boxY, 97, 54).fill('#1a1a1a');

          // Label
          doc
            .fillColor('#29dcff')
            .font('Helvetica-Bold')
            .fontSize(7)
            .text(box.label, x + 8, boxY + 8);

          // Value
          doc
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(11)
            .text(box.value, x + 8, boxY + 22, { width: 82 });
        });

        // Divider before QR section
        doc
          .moveTo(444, 62)
          .lineTo(444, 262)
          .strokeColor('#2a2a2a')
          .lineWidth(1)
          .stroke();

        // QR code
        const qrDataUrl = await QRCode.toDataURL(ticket.qr_code, {
          width:  140,
          margin: 1,
          color: {
            dark:  '#ffffff',
            light: '#0a0a0a'
          }
        });

        // Strip data URL prefix to get raw base64
        const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(qrBase64, 'base64');

        doc.image(qrBuffer, 452, 66, { width: 124, height: 124 });

        // Scan label under QR
        doc
          .fillColor('#6b7280')
          .font('Helvetica')
          .fontSize(7)
          .text('SCAN AT ENTRY', 452, 196, { width: 124, align: 'center' });

        // Ticket index for multiple tickets
        if (tickets.length > 1) {
          doc
            .fillColor('#29dcff')
            .font('Helvetica-Bold')
            .fontSize(8)
            .text(`${i + 1} of ${tickets.length}`, 452, 212, { width: 124, align: 'center' });
        }

        // Ticket ID footer
        doc
          .fillColor('#374151')
          .font('Helvetica')
          .fontSize(7)
          .text(`Ticket ID: ${ticket.id}`, 22, 248)
          .text(`Order:     ${ticket.purchase_id}`, 22, 258);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateTicketPDF };
