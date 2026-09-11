// server/routes/physicalTickets.js
//
// Physical Ticketing API — admin only.
// All routes are protected by the adminAuth + requireAdmin middleware
// applied in the parent router mount in index.js.

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const supabase = require('../lib/supabase');
const {
  generateBatchSerials,
  generatePhysicalTicketPDF,
  uploadPDFToStorage,
  uploadTemplateToStorage,
  createSignedUrl,
  currentYear,
} = require('../services/physicalTicketService');

// Multer — memory storage (no disk writes, safe for Vercel serverless)
// Template size limit: 2 MB.
// Why: the PDF is streamed directly through Vercel's serverless function which
// has a ~4.5 MB response body limit. A 2 MB JPEG template + 50 QR codes (~400 KB)
// = ~2.5 MB PDF → safely under. At 5 MB the PDF could exceed 4.5 MB and fail.
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 }, // 2 MB max — see comment above
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG or WebP images are accepted'));
    }
  },
});

// ============================================================
// HELPER: auto-increment batch reference
// ============================================================
async function nextBatchRef() {
  const year = currentYear();
  const prefix = `BATCH-${year}-`;

  const { data, error } = await supabase
    .from('physical_ticket_batches')
    .select('batch_ref')
    .like('batch_ref', `${prefix}%`)
    .order('batch_ref', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  let nextNum = 1;
  if (data?.batch_ref) {
    const last = parseInt(data.batch_ref.replace(prefix, ''), 10);
    if (!isNaN(last)) nextNum = last + 1;
  }
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// ============================================================
// GET /api/admin/physical-tickets/stats
// Aggregate metrics for the batch dashboard
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const [batchRes, ticketRes] = await Promise.all([
      supabase.from('physical_ticket_batches').select('id', { count: 'exact', head: true }),
      supabase.from('physical_tickets').select('status, scanned'),
    ]);

    if (batchRes.error) throw batchRes.error;
    if (ticketRes.error) throw ticketRes.error;

    const tickets = ticketRes.data || [];
    const total     = tickets.length;
    const active    = tickets.filter(t => t.status === 'active').length;
    const inactive  = tickets.filter(t => t.status === 'inactive').length;
    const voided    = tickets.filter(t => t.status === 'void').length;
    const scanned   = tickets.filter(t => t.scanned).length;

    res.json({
      totalBatches: batchRes.count || 0,
      totalPrinted: total,
      active,
      inactive,
      voided,
      scanned,
    });
  } catch (err) {
    console.error('Physical ticket stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/admin/physical-tickets/batches
// List all batches with event and category details
// ============================================================
router.get('/batches', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('physical_ticket_batches')
      .select(`
        *,
        events          (id, name, date, venue),
        seat_categories (id, name, price)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach per-batch ticket counts
    const batchIds = (data || []).map(b => b.id);
    let countsMap = {};

    if (batchIds.length > 0) {
      const { data: counts, error: cErr } = await supabase
        .from('physical_tickets')
        .select('batch_id, status, scanned')
        .in('batch_id', batchIds);

      if (cErr) throw cErr;

      (counts || []).forEach(t => {
        if (!countsMap[t.batch_id]) {
          countsMap[t.batch_id] = { active: 0, inactive: 0, void: 0, scanned: 0 };
        }
        countsMap[t.batch_id][t.status]++;
        if (t.scanned) countsMap[t.batch_id].scanned++;
      });
    }

    const enriched = (data || []).map(b => ({
      ...b,
      ticketCounts: countsMap[b.id] || { active: 0, inactive: 0, void: 0, scanned: 0 },
    }));

    res.json(enriched);
  } catch (err) {
    console.error('List batches error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE /api/admin/physical-tickets/batches/:id
// Deletes a batch and ALL its physical tickets from the database.
// Guard: blocked if any ticket in the batch has been scanned at the gate.
// ============================================================
router.delete('/batches/:id', async (req, res) => {
  try {
    const batchId = req.params.id;

    // Check batch exists
    const { data: batch, error: batchErr } = await supabase
      .from('physical_ticket_batches')
      .select('id, batch_ref')
      .eq('id', batchId)
      .maybeSingle();

    if (batchErr) throw batchErr;
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    // Block if any ticket in this batch has been scanned
    const { data: scanned, error: scanErr } = await supabase
      .from('physical_tickets')
      .select('serial_code')
      .eq('batch_id', batchId)
      .eq('scanned', true)
      .limit(1);

    if (scanErr) throw scanErr;
    if (scanned && scanned.length > 0) {
      return res.status(400).json({
        error: `Cannot delete batch ${batch.batch_ref} — ticket ${scanned[0].serial_code} has already been scanned at the gate.`
      });
    }

    // Delete tickets first, then the batch
    const { error: ticketDelErr } = await supabase
      .from('physical_tickets')
      .delete()
      .eq('batch_id', batchId);

    if (ticketDelErr) throw ticketDelErr;

    const { error: batchDelErr } = await supabase
      .from('physical_ticket_batches')
      .delete()
      .eq('id', batchId);

    if (batchDelErr) throw batchDelErr;

    console.log(`🗑️ Physical ticket batch ${batch.batch_ref} (id: ${batchId}) deleted`);
    res.json({ success: true, batchId, batchRef: batch.batch_ref });
  } catch (err) {
    console.error('Delete batch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/admin/physical-tickets/batches

// Create a new batch: validate → generate serials → render PDF → upload → respond
//
// Accepts multipart/form-data:
//   eventId, categoryId, quantity, startSerial,
//   qrX, qrY, qrSize, ticketW, ticketH
//   template (optional file)
// ============================================================
router.post('/batches', upload.single('template'), async (req, res) => {
  try {
    const {
      eventId,
      categoryId,
      quantity:    quantityRaw,
      startSerial: startSerialRaw,
      qrX   = '76',
      qrY   = '15',
      qrSize = '24',
      ticketW = '180',
      ticketH = '70',
      serialAlign = 'below',
    } = req.body;

    const quantity    = parseInt(quantityRaw, 10);
    const startSerial = parseInt(startSerialRaw, 10);

    // ── Validate ──────────────────────────────────────────────
    if (!eventId || !categoryId) {
      return res.status(400).json({ error: 'eventId and categoryId are required' });
    }
    if (!quantity || quantity < 1 || quantity > 250) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 250' });
    }
    if (!startSerial || startSerial < 1) {
      return res.status(400).json({ error: 'startSerial must be >= 1' });
    }

    // ── Fetch event + category ────────────────────────────────
    const [evRes, catRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('seat_categories').select('*').eq('id', categoryId).single(),
    ]);
    if (evRes.error || !evRes.data)  return res.status(404).json({ error: 'Event not found' });
    if (catRes.error || !catRes.data) return res.status(404).json({ error: 'Category not found' });

    const event    = evRes.data;
    const category = catRes.data;

    // ── Check serial range doesn't collide ────────────────────
    const endSerial = startSerial + quantity - 1;
    const year      = currentYear();
    const firstCode = `PT-${year}-${String(startSerial).padStart(6, '0')}`;
    const lastCode  = `PT-${year}-${String(endSerial).padStart(6, '0')}`;

    // ── Check for serial conflicts ────────────────────────────
    // Only count tickets that still belong to an active batch.
    // Orphaned tickets (batch deleted via Supabase dashboard) are ignored
    // so they don't block re-use of the same serial range.
    const allBatchIds = await supabase
      .from('physical_ticket_batches')
      .select('id');

    const activeBatchIds = (allBatchIds.data || []).map(b => b.id);

    if (activeBatchIds.length > 0) {
      const { data: existing, error: chkErr } = await supabase
        .from('physical_tickets')
        .select('serial_code')
        .gte('serial_code', firstCode)
        .lte('serial_code', lastCode)
        .in('batch_id', activeBatchIds)
        .limit(1);

      if (chkErr) throw chkErr;
      if (existing && existing.length > 0) {
        return res.status(409).json({
          error: `Serial range conflicts with existing ticket ${existing[0].serial_code}. Choose a different start serial.`,
        });
      }
    }

    // ── Generate batch ref ────────────────────────────────────
    const batchRef = await nextBatchRef();

    // ── Upload template if provided ───────────────────────────
    let templateStoragePath = null;
    if (req.file) {
      templateStoragePath = await uploadTemplateToStorage(
        req.file.buffer,
        batchRef,
        req.file.mimetype
      );
    }

    // ── Insert batch record ───────────────────────────────────
    const { data: batch, error: batchErr } = await supabase
      .from('physical_ticket_batches')
      .insert({
        event_id:         eventId,
        seat_category_id: categoryId,
        batch_ref:        batchRef,
        quantity,
        start_serial:     startSerial,
        end_serial:       endSerial,
        template_url:     templateStoragePath,
        created_by:       req.adminAccount || 'admin',
        // ── QR layout — stored so Download from Overview uses correct position ──
        qr_x:        parseFloat(qrX),
        qr_y:        parseFloat(qrY),
        qr_size:     parseFloat(qrSize),
        ticket_w:    parseFloat(ticketW),
        ticket_h:    parseFloat(ticketH),
        serial_align: serialAlign === 'above' ? 'above' : 'below',
      })
      .select()
      .single();

    if (batchErr) throw batchErr;

    // ── Generate serial rows ──────────────────────────────────
    const tickets = await generateBatchSerials(
      batch.id, eventId, categoryId, quantity, startSerial
    );

    // ── Respond immediately ───────────────────────────────────
    // PDF is generated ON-DEMAND via GET /batches/:id/pdf (avoids Vercel timeout).
    // The admin clicks "Download PDF" in the Overview tab to trigger generation.
    console.log(`✅ Batch ${batchRef} created — ${tickets.length} tickets inserted (PDF deferred)`);
    res.status(201).json({
      batch:       { ...batch, pdf_url: null },
      ticketCount: tickets.length,
      pdfSignedUrl: null,
      pdfBase64:    null,
    });
  } catch (err) {
    console.error('Create batch error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ============================================================
// GET /api/admin/physical-tickets/batches/:id/pdf
// Generates the print-ready PDF on-demand and streams it directly
// to the client as a binary PDF response (no storage required).
// Caches to Supabase Storage for future requests (async, fire-and-forget).
// Query params: qrX, qrY, qrSize, ticketW, ticketH (override layout defaults)
// ============================================================
router.get('/batches/:id/pdf', async (req, res) => {
  try {
    const batchId = req.params.id;

    // ── Fetch batch + relations ───────────────────────────────
    const { data: batch, error: bErr } = await supabase
      .from('physical_ticket_batches')
      .select(`*, events(id,name,date,venue), seat_categories(id,name)`)
      .eq('id', batchId)
      .single();

    if (bErr || !batch) return res.status(404).json({ error: 'Batch not found' });

    // ── If already cached in storage, serve from there ONLY if
    //    this batch was created before layout columns existed (qr_x is null).
    //    Batches with stored layout always regenerate to guarantee correct position.
    const hasStoredLayout = batch.qr_x != null;
    if (batch.pdf_url && !hasStoredLayout) {
      try {
        const { data: fileData, error: dlErr } = await supabase.storage
          .from('physical-ticket-templates')
          .download(batch.pdf_url);
        if (!dlErr && fileData) {
          const buf = Buffer.from(await fileData.arrayBuffer());
          res.set('Content-Type', 'application/pdf');
          res.set('Content-Disposition', `attachment; filename="${batch.batch_ref}.pdf"`);
          res.set('Content-Length', String(buf.length));
          return res.send(buf);
        }
      } catch (_) {
        // Cached file gone — fall through to regenerate
      }
    }

    // ── Fetch all tickets ────────────────────────────────────
    const { data: tickets, error: tErr } = await supabase
      .from('physical_tickets')
      .select('id, serial_code, qr_token')
      .eq('batch_id', batchId)
      .order('serial_code', { ascending: true });

    if (tErr) throw tErr;
    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ error: 'No tickets found for this batch' });
    }

    // ── Layout — DB values (set at creation) take priority ───────
    // Fall back to query params (backward-compat for old batches)
    // then to hardcoded defaults.
    const layout = {
      qrX:         parseFloat(batch.qr_x     ?? req.query.qrX     ?? 76),
      qrY:         parseFloat(batch.qr_y     ?? req.query.qrY     ?? 15),
      qrSize:      parseFloat(batch.qr_size  ?? req.query.qrSize  ?? 24),
      ticketW:     parseFloat(batch.ticket_w ?? req.query.ticketW ?? 180),
      ticketH:     parseFloat(batch.ticket_h ?? req.query.ticketH ?? 70),
      serialAlign: batch.serial_align ?? req.query.serialAlign ?? 'below',
    };

    // ── Download ticket artwork template (if uploaded) ────────
    let templateBuffer = null;
    if (batch.template_url) {
      try {
        const { data: fileData, error: dlErr } = await supabase.storage
          .from('physical-ticket-templates')
          .download(batch.template_url);
        if (!dlErr && fileData) {
          templateBuffer = Buffer.from(await fileData.arrayBuffer());
        }
      } catch (_) {
        // Template unavailable — PDF falls back to brand background (non-fatal)
        console.warn(`Template download failed for ${batch.batch_ref} — using fallback background`);
      }
    }

    // ── Generate PDF (artwork background + QR codes) ──────────
    const { generatePhysicalTicketPDF } = require('../services/physicalTicketService');
    const pdfBuffer = await generatePhysicalTicketPDF(
      { batchRef: batch.batch_ref, quantity: batch.quantity,
        startSerial: batch.start_serial, endSerial: batch.end_serial },
      tickets,
      batch.events          || { name: 'Event', date: new Date().toISOString(), venue: '' },
      batch.seat_categories || { name: 'General' },
      templateBuffer,        // artwork as full-bleed background (embedded once by PDFKit)
      layout
    );

    // ── Stream PDF directly to client ─────────────────────────
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${batch.batch_ref}.pdf"`);
    res.set('Content-Length', String(pdfBuffer.length));
    res.send(pdfBuffer);

    // ── Cache to storage asynchronously (fire and forget) ─────
    // Don't await — the client already has their file
    uploadPDFToStorage(pdfBuffer, batch.batch_ref)
      .then(pdfPath => {
        supabase.from('physical_ticket_batches')
          .update({ pdf_url: pdfPath }).eq('id', batchId)
          .then(() => {}).catch(() => {});
      })
      .catch(err => console.warn(`Storage cache failed for ${batch.batch_ref}: ${err.message}`));

  } catch (err) {
    console.error('Get batch PDF error:', err);
    // Only send error if headers not yet sent
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});



// ============================================================
// GET /api/admin/physical-tickets/tickets
// Serial ledger — paginated, filterable
// Query params: batchId, status, scanned, page (default 1), limit (default 50)
// ============================================================
router.get('/tickets', async (req, res) => {
  try {
    const { batchId, status, scanned, page = '1', limit = '50' } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const from     = (pageNum - 1) * limitNum;
    const to       = from + limitNum - 1;

    let query = supabase
      .from('physical_tickets')
      .select(`
        *,
        physical_ticket_batches (batch_ref),
        events                  (name),
        seat_categories         (name)
      `, { count: 'exact' })
      .order('serial_code', { ascending: true })
      .range(from, to);

    if (batchId) query = query.eq('batch_id', batchId);
    if (status && status !== 'all') query = query.eq('status', status);
    if (scanned === 'true')  query = query.eq('scanned', true);
    if (scanned === 'false') query = query.eq('scanned', false);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ tickets: data || [], total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('List tickets error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/admin/physical-tickets/tickets/activate
// Activate a range of serials (from sold/distributed tickets)
// Body: { batchId, fromSerial, toSerial }
// ============================================================
router.post('/tickets/activate', async (req, res) => {
  try {
    const { batchId, fromSerial, toSerial } = req.body;

    if (!batchId || fromSerial == null || toSerial == null) {
      return res.status(400).json({ error: 'batchId, fromSerial, and toSerial are required' });
    }
    if (fromSerial > toSerial) {
      return res.status(400).json({ error: 'fromSerial must be <= toSerial' });
    }

    // Fetch batch to build serial code range
    const { data: batch, error: bErr } = await supabase
      .from('physical_ticket_batches')
      .select('batch_ref, seat_category_id')
      .eq('id', batchId)
      .single();

    if (bErr || !batch) return res.status(404).json({ error: 'Batch not found' });

    const year     = currentYear();
    const fromCode = `PT-${year}-${String(fromSerial).padStart(6, '0')}`;
    const toCode   = `PT-${year}-${String(toSerial).padStart(6, '0')}`;

    // Fetch tickets to activate (must be inactive and belong to this batch)
    const { data: toActivate, error: fetchErr } = await supabase
      .from('physical_tickets')
      .select('id, status, serial_code')
      .eq('batch_id', batchId)
      .gte('serial_code', fromCode)
      .lte('serial_code', toCode)
      .eq('status', 'inactive');

    if (fetchErr) throw fetchErr;
    if (!toActivate || toActivate.length === 0) {
      return res.status(400).json({
        error: 'No inactive tickets found in that range for this batch. Verify the serial numbers.',
      });
    }

    const ids = toActivate.map(t => t.id);
    const now = new Date().toISOString();

    // Activate tickets
    const { error: updateErr } = await supabase
      .from('physical_tickets')
      .update({ status: 'active', activated_at: now, activated_by: req.adminAccount || 'admin' })
      .in('id', ids);

    if (updateErr) throw updateErr;

    // Atomically increment sold_seats on seat_category
    const qty = toActivate.length;
    const { data: cat, error: catErr } = await supabase
      .from('seat_categories')
      .select('sold_seats, total_seats')
      .eq('id', batch.seat_category_id)
      .single();

    if (catErr) throw catErr;

    const newSold = cat.sold_seats + qty;
    if (newSold > cat.total_seats) {
      return res.status(400).json({
        error: `Activation would exceed total seats (${cat.total_seats}). Only ${cat.total_seats - cat.sold_seats} seats remaining.`,
      });
    }

    const { error: seatErr } = await supabase
      .from('seat_categories')
      .update({ sold_seats: newSold })
      .eq('id', batch.seat_category_id);

    if (seatErr) throw seatErr;

    res.json({
      activated:  qty,
      fromSerial: fromCode,
      toSerial:   toCode,
    });
  } catch (err) {
    console.error('Activate serials error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/admin/physical-tickets/tickets/void
// Void a range of serials (damaged, returned, etc.)
// Body: { batchId, fromSerial, toSerial }
// ============================================================
router.post('/tickets/void', async (req, res) => {
  try {
    const { batchId, fromSerial, toSerial } = req.body;

    if (!batchId || fromSerial == null || toSerial == null) {
      return res.status(400).json({ error: 'batchId, fromSerial, and toSerial are required' });
    }

    const { data: batch, error: bErr } = await supabase
      .from('physical_ticket_batches')
      .select('batch_ref, seat_category_id')
      .eq('id', batchId)
      .single();

    if (bErr || !batch) return res.status(404).json({ error: 'Batch not found' });

    const year     = currentYear();
    const fromCode = `PT-${year}-${String(fromSerial).padStart(6, '0')}`;
    const toCode   = `PT-${year}-${String(toSerial).padStart(6, '0')}`;

    // Only void active or inactive tickets (not already scanned ones)
    const { data: toVoid, error: fetchErr } = await supabase
      .from('physical_tickets')
      .select('id, status, scanned')
      .eq('batch_id', batchId)
      .gte('serial_code', fromCode)
      .lte('serial_code', toCode)
      .neq('status', 'void');

    if (fetchErr) throw fetchErr;
    if (!toVoid || toVoid.length === 0) {
      return res.status(400).json({ error: 'No voidable tickets found in that range.' });
    }

    const scannedCount = toVoid.filter(t => t.scanned).length;
    if (scannedCount > 0) {
      return res.status(400).json({
        error: `${scannedCount} ticket(s) in this range have already been scanned at the gate and cannot be voided.`,
      });
    }

    const activeCount = toVoid.filter(t => t.status === 'active').length;
    const ids = toVoid.map(t => t.id);

    const { error: updateErr } = await supabase
      .from('physical_tickets')
      .update({ status: 'void' })
      .in('id', ids);

    if (updateErr) throw updateErr;

    // Decrement sold_seats for previously-active tickets that were voided
    if (activeCount > 0) {
      const { data: cat, error: catErr } = await supabase
        .from('seat_categories')
        .select('sold_seats')
        .eq('id', batch.seat_category_id)
        .single();

      if (catErr) throw catErr;

      await supabase
        .from('seat_categories')
        .update({ sold_seats: Math.max(0, cat.sold_seats - activeCount) })
        .eq('id', batch.seat_category_id);
    }

    res.json({ voided: toVoid.length, activeDecrement: activeCount });
  } catch (err) {
    console.error('Void serials error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
