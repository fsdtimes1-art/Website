// server/services/physicalTicketService.js
//
// Physical Ticket PDF & serial generation service.
// Uses pdfkit + qrcode + uuid (already in package.json) — no new dependencies.
//
// QR SECURITY MODEL:
//   serial_code = "PT-2026-000042" — human-readable, printed as text on ticket
//   qr_token    = uuid4()          — cryptographically random, encoded in QR only
//   The two are DIFFERENT. Knowing the serial does NOT help forge the QR.

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');
const { v4: uuidv4 } = require('uuid');
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
      // ── SECURITY: qr_token is a random UUID, NOT the serial code.
      // The QR printed on the ticket encodes this UUID only.
      // serial_code is printed as visible text (for staff reference only).
      // Even if someone copies the serial number, they cannot construct the QR.
      qr_token:         uuidv4(),
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

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size:    [pW, pH],
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        autoFirstPage: false,
      });

      const chunks = [];
      doc.on('data',  c  => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        doc.addPage();

        // ── Artwork template (full bleed) ─────────────────────
        // If an artwork image was uploaded, place it as the full background.
        // Everything else (event name, date, venue, branding) is already
        // part of the ticket design — we only add QR + serial on top.
        if (templateBuffer) {
          try {
            doc.image(templateBuffer, 0, 0, {
              width:  pW,
              height: pH,
              cover:  [pW, pH],
            });
          } catch (_) {
            // Template image failed — fall back to dark background
            doc.rect(0, 0, pW, pH).fill('#0a0a0a');
          }
        } else {
          // No template — plain dark Faisalabad Times brand background
          doc.rect(0, 0, pW, pH).fill('#0a0a0a');
          doc.rect(0, 0, 5, pH).fill('#29dcff'); // cyan accent stripe
        }

        // ── QR Code ───────────────────────────────────────────
        // Encode the secure UUID token (NOT the serial_code).
        const qrDataUrl = await QRCode.toDataURL(ticket.qr_token, {
          errorCorrectionLevel: 'H',            // highest redundancy
          width:  Math.round(qrPs * 3),         // 3× oversampled — crisp at 300 DPI print
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        const qrBuffer = Buffer.from(
          qrDataUrl.replace(/^data:image\/png;base64,/, ''),
          'base64'
        );
        doc.image(qrBuffer, qrPx, qrPy, { width: qrPs, height: qrPs });

        // ── Serial number below QR ────────────────────────────
        // Printed in small text under the QR for staff reference only.
        doc
          .fillColor('#ffffff')
          .font('Helvetica')
          .fontSize(5.5)
          .text(ticket.serial_code, qrPx, qrPy + qrPs + 3, {
            width: qrPs, align: 'center',
          });
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
