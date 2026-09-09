// server/services/physicalTicketService.js
//
// Physical Ticket PDF & serial generation service.
// Uses pdfkit + qrcode (already in package.json) — no new dependencies.

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const supabase    = require('../lib/supabase');

// ── 1. SERIAL CODE HELPERS ────────────────────────────────────

/**
 * Formats a numeric serial into the standard PT-YYYY-NNNNNN format.
 * e.g. padSerial(2026, 42) → "PT-2026-000042"
 */
function padSerial(year, num) {
  return `PT-${year}-${String(num).padStart(6, '0')}`;
}

/**
 * Returns the current year (PKT, UTC+5).
 */
function currentYear() {
  return new Date().toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    year:     'numeric',
  });
}

// ── 2. BATCH SERIAL GENERATION ────────────────────────────────

/**
 * Inserts `quantity` physical_tickets rows into the DB for a given batch.
 * Returns the inserted rows.
 *
 * @param {string} batchId
 * @param {string} eventId
 * @param {string} categoryId
 * @param {number} quantity      1-250
 * @param {number} startSerial   e.g. 1
 * @returns {Promise<Array>}
 */
async function generateBatchSerials(batchId, eventId, categoryId, quantity, startSerial) {
  const year = currentYear();
  const rows = [];

  for (let i = 0; i < quantity; i++) {
    const serial = padSerial(year, startSerial + i);
    rows.push({
      batch_id:         batchId,
      event_id:         eventId,
      seat_category_id: categoryId,
      serial_code:      serial,
      qr_token:         serial, // QR encodes the serial directly (PT- prefix = physical)
      status:           'inactive',
    });
  }

  const { data, error } = await supabase
    .from('physical_tickets')
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

// ── 3. PHYSICAL TICKET PDF GENERATION ────────────────────────

/**
 * Generates a print-ready PDF buffer for a batch of physical tickets.
 *
 * Each ticket page:
 *   - Full-page background in Faisalabad Times brand colours
 *   - Overlaid ticket artwork template (if provided)
 *   - QR code at the specified X/Y position (% of ticket dimensions)
 *   - Serial code, event name, category printed below the QR
 *
 * @param {Object}  batchMeta          - { batchRef, quantity, startSerial, endSerial }
 * @param {Array}   tickets            - physical_tickets rows
 * @param {Object}  event              - events row { name, date, venue }
 * @param {Object}  category           - seat_categories row { name }
 * @param {Buffer|null} templateBuffer - optional artwork image buffer
 * @param {Object}  layout             - { qrX, qrY, qrSize, ticketW, ticketH } (mm)
 * @returns {Promise<Buffer>}
 */
async function generatePhysicalTicketPDF(
  batchMeta,
  tickets,
  event,
  category,
  templateBuffer = null,
  layout = {}
) {
  const {
    qrX      = 76,   // QR left edge, % of ticket width
    qrY      = 15,   // QR top edge,  % of ticket height
    qrSize   = 24,   // mm
    ticketW  = 180,  // mm
    ticketH  = 70,   // mm
  } = layout;

  // Convert mm → PDF points (1mm ≈ 2.8346 pt)
  const MM   = 2.8346;
  const pW   = ticketW * MM;
  const pH   = ticketH * MM;
  const qrPx = (qrX / 100) * pW;
  const qrPy = (qrY / 100) * pH;
  const qrPs = qrSize * MM;

  const dateStr = new Date(event.date).toLocaleDateString('en-PK', {
    timeZone: 'Asia/Karachi',
    weekday: 'short',
    year:    'numeric',
    month:   'short',
    day:     'numeric',
  });

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size:    [pW, pH],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        autoFirstPage: false,
      });

      const chunks = [];
      doc.on('data',  c   => chunks.push(c));
      doc.on('end',   ()  => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        doc.addPage();

        // ── Background ──────────────────────────────────────
        doc.rect(0, 0, pW, pH).fill('#0a0a0a');

        // ── Cyan accent bar (left edge) ─────────────────────
        doc.rect(0, 0, 6, pH).fill('#29dcff');

        // ── Header band ─────────────────────────────────────
        doc.rect(6, 0, pW - 6, pH * 0.22).fill('#111111');

        // ── Artwork template (if provided) ───────────────────
        if (templateBuffer) {
          try {
            doc.image(templateBuffer, 0, 0, {
              width:  pW,
              height: pH,
              cover:  [pW, pH],
            });
            // Darken overlay so text stays legible
            doc.rect(0, 0, pW, pH).fillOpacity(0.45).fill('#000000');
            doc.fillOpacity(1);
          } catch (_) {
            // Template image failed — continue with plain background
          }
        }

        // ── Brand name ───────────────────────────────────────
        doc
          .fillColor('#29dcff')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('FAISALABAD TIMES', 16, pH * 0.07);

        // ── Event name ───────────────────────────────────────
        doc
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .fontSize(14)
          .text(event.name, 16, pH * 0.28, { width: pW * 0.62, ellipsis: true });

        // ── Date + venue ─────────────────────────────────────
        doc
          .fillColor('#9ca3af')
          .font('Helvetica')
          .fontSize(7)
          .text(dateStr,    16, pH * 0.53)
          .text(event.venue, 16, pH * 0.65, { width: pW * 0.58 });

        // ── Category badge ───────────────────────────────────
        const badgeX = 16;
        const badgeY = pH * 0.78;
        doc.roundedRect(badgeX, badgeY, 60, 14, 3).fill('#29dcff');
        doc
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .fontSize(6)
          .text(category.name.toUpperCase(), badgeX + 4, badgeY + 4);

        // ── QR Code ──────────────────────────────────────────
        const qrDataUrl = await QRCode.toDataURL(ticket.qr_token, {
          errorCorrectionLevel: 'H',   // highest, per spec
          width:  Math.round(qrPs * 3), // generate at 3× for crispness
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        const qrBuffer = Buffer.from(
          qrDataUrl.replace(/^data:image\/png;base64,/, ''),
          'base64'
        );
        doc.image(qrBuffer, qrPx, qrPy, { width: qrPs, height: qrPs });

        // ── Serial code under QR ──────────────────────────────
        doc
          .fillColor('#6b7280')
          .font('Helvetica')
          .fontSize(5.5)
          .text(ticket.serial_code, qrPx, qrPy + qrPs + 3, {
            width: qrPs, align: 'center',
          });

        // ── Ticket count footer ───────────────────────────────
        if (tickets.length > 1) {
          doc
            .fillColor('#374151')
            .font('Helvetica')
            .fontSize(5)
            .text(`${i + 1} / ${tickets.length}`, pW - 30, pH - 10);
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ── 4. SUPABASE STORAGE UPLOAD ────────────────────────────────

/**
 * Uploads the generated PDF to Supabase Storage (private bucket).
 * Returns the storage path (not a public URL).
 *
 * @param {Buffer} pdfBuffer
 * @param {string} batchRef   e.g. "BATCH-2026-001"
 * @returns {Promise<string>} storage path
 */
async function uploadPDFToStorage(pdfBuffer, batchRef) {
  const path = `pdfs/${batchRef}.pdf`;
  const { error } = await supabase
    .storage
    .from('physical-ticket-templates')
    .upload(path, pdfBuffer, {
      contentType:  'application/pdf',
      upsert:       true,
    });

  if (error) throw error;
  return path;
}

/**
 * Uploads a template artwork image to Supabase Storage.
 *
 * @param {Buffer} imageBuffer
 * @param {string} batchRef
 * @param {string} mimeType   e.g. "image/jpeg"
 * @returns {Promise<string>} storage path
 */
async function uploadTemplateToStorage(imageBuffer, batchRef, mimeType) {
  const ext  = mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `templates/${batchRef}.${ext}`;
  const { error } = await supabase
    .storage
    .from('physical-ticket-templates')
    .upload(path, imageBuffer, { contentType: mimeType, upsert: true });

  if (error) throw error;
  return path;
}

/**
 * Creates a short-lived signed URL (24h) for a private Storage path.
 *
 * @param {string} storagePath
 * @returns {Promise<string>} signed URL
 */
async function createSignedUrl(storagePath) {
  const { data, error } = await supabase
    .storage
    .from('physical-ticket-templates')
    .createSignedUrl(storagePath, 86400); // 24 hours

  if (error) throw error;
  return data.signedUrl;
}

module.exports = {
  padSerial,
  currentYear,
  generateBatchSerials,
  generatePhysicalTicketPDF,
  uploadPDFToStorage,
  uploadTemplateToStorage,
  createSignedUrl,
};
