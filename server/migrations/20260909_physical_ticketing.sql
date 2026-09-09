-- ============================================================
-- Faisalabad Times: Physical Ticketing Integration
-- Run ONCE in the Supabase SQL Editor (Settings → SQL Editor)
-- This migration is 100% additive — no existing tables altered.
-- ============================================================

-- ── 1. PHYSICAL TICKET BATCHES ────────────────────────────────
-- One record per print run (e.g. "500 VIP tickets for Shendi")
CREATE TABLE IF NOT EXISTS public.physical_ticket_batches (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID        NOT NULL REFERENCES public.events(id)          ON DELETE RESTRICT,
  seat_category_id UUID        NOT NULL REFERENCES public.seat_categories(id) ON DELETE RESTRICT,
  batch_ref        TEXT        UNIQUE NOT NULL,   -- e.g. "BATCH-2026-001"
  quantity         INTEGER     NOT NULL CHECK (quantity BETWEEN 1 AND 250),
  start_serial     INTEGER     NOT NULL,
  end_serial       INTEGER     NOT NULL,
  template_url     TEXT,                          -- Supabase Storage path for artwork
  pdf_url          TEXT,                          -- generated printable PDF path / signed URL
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       TEXT                           -- admin account actor
);

-- ── 2. PHYSICAL TICKETS ───────────────────────────────────────
-- One row per physically printed ticket
CREATE TABLE IF NOT EXISTS public.physical_tickets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         UUID        NOT NULL REFERENCES public.physical_ticket_batches(id) ON DELETE CASCADE,
  event_id         UUID        NOT NULL REFERENCES public.events(id)          ON DELETE RESTRICT,
  seat_category_id UUID        NOT NULL REFERENCES public.seat_categories(id) ON DELETE RESTRICT,
  serial_code      TEXT        UNIQUE NOT NULL,   -- e.g. "PT-2026-000042"
  qr_token         TEXT        UNIQUE NOT NULL,   -- same as serial_code; the QR payload
  status           TEXT        NOT NULL DEFAULT 'inactive'
                               CHECK (status IN ('inactive','active','void')),
  scanned          BOOLEAN     NOT NULL DEFAULT false,
  scanned_at       TIMESTAMPTZ,
  activated_at     TIMESTAMPTZ,
  activated_by     TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_physical_tickets_qr_token
  ON public.physical_tickets(qr_token);

CREATE INDEX IF NOT EXISTS idx_physical_tickets_batch_id
  ON public.physical_tickets(batch_id);

CREATE INDEX IF NOT EXISTS idx_physical_tickets_status
  ON public.physical_tickets(status);

CREATE INDEX IF NOT EXISTS idx_physical_ticket_batches_event
  ON public.physical_ticket_batches(event_id);

-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────
-- Tables are fully server-side (service_role key) — anon/authenticated have NO access.
ALTER TABLE public.physical_ticket_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_tickets        ENABLE ROW LEVEL SECURITY;

-- No public SELECT policies — service_role bypasses RLS automatically.

-- ── 5. STORAGE BUCKET ─────────────────────────────────────────
-- Private bucket for template artwork and generated PDFs.
-- Manually create via Supabase Dashboard → Storage → New Bucket if SQL INSERT fails.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'physical-ticket-templates',
  'physical-ticket-templates',
  false,
  52428800,  -- 50 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ── 6. UNIFIED TICKET VERIFY RPC ─────────────────────────────
-- Atomically verifies AND marks scanned for BOTH online (UUID) and
-- physical (PT-...) tickets. Uses FOR UPDATE to prevent double-scan
-- race conditions when two gate staff scan the same ticket simultaneously.

CREATE OR REPLACE FUNCTION public.admin_verify_ticket_by_qr(p_qr TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket      public.tickets%ROWTYPE;
  v_phys        public.physical_tickets%ROWTYPE;
  v_event_name  TEXT;
  v_venue       TEXT;
  v_cat_name    TEXT;
BEGIN

  -- ── Case A: Physical Ticket (starts with "PT-") ────────────
  IF p_qr LIKE 'PT-%' THEN

    SELECT pt.* INTO v_phys
    FROM public.physical_tickets pt
    WHERE pt.qr_token = p_qr
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'valid',   false,
        'message', '❌ Invalid ticket — QR code not recognised',
        'ticket',  NULL
      );
    END IF;

    -- Not yet activated / sold
    IF v_phys.status = 'inactive' THEN
      RETURN jsonb_build_object(
        'valid',   false,
        'message', '❌ Ticket not yet activated / sold',
        'ticket',  NULL
      );
    END IF;

    -- Voided
    IF v_phys.status = 'void' THEN
      RETURN jsonb_build_object(
        'valid',   false,
        'message', '❌ Ticket has been cancelled / void',
        'ticket',  NULL
      );
    END IF;

    -- Already scanned
    IF v_phys.scanned THEN
      RETURN jsonb_build_object(
        'valid',          false,
        'alreadyScanned', true,
        'message',        '❌ Already scanned at ' || to_char(v_phys.scanned_at AT TIME ZONE 'Asia/Karachi', 'DD Mon YYYY HH12:MI AM'),
        'ticket',         jsonb_build_object(
          'buyerName', 'Physical Ticket',
          'event',     (SELECT name FROM public.events WHERE id = v_phys.event_id),
          'seat',      v_phys.serial_code,
          'category',  (SELECT name FROM public.seat_categories WHERE id = v_phys.seat_category_id)
        )
      );
    END IF;

    -- All clear — mark scanned
    UPDATE public.physical_tickets
    SET scanned    = true,
        scanned_at = NOW()
    WHERE id = v_phys.id;

    SELECT e.name, e.venue INTO v_event_name, v_venue
    FROM public.events e WHERE e.id = v_phys.event_id;

    SELECT sc.name INTO v_cat_name
    FROM public.seat_categories sc WHERE sc.id = v_phys.seat_category_id;

    RETURN jsonb_build_object(
      'valid',   true,
      'message', '✅ Ticket verified — Physical Ticket ' || v_phys.serial_code,
      'ticket',  jsonb_build_object(
        'buyerName', 'Physical Ticket',
        'event',     v_event_name,
        'venue',     v_venue,
        'seat',      v_phys.serial_code,
        'category',  v_cat_name
      )
    );

  -- ── Case B: Online E-Ticket (UUID) ─────────────────────────
  ELSE

    SELECT t.* INTO v_ticket
    FROM public.tickets t
    WHERE t.qr_code = p_qr
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'valid',   false,
        'message', '❌ Invalid ticket — QR code not recognised',
        'ticket',  NULL
      );
    END IF;

    IF v_ticket.scanned THEN
      RETURN jsonb_build_object(
        'valid',          false,
        'alreadyScanned', true,
        'message',        '❌ Ticket already scanned at ' || to_char(v_ticket.scanned_at AT TIME ZONE 'Asia/Karachi', 'DD Mon YYYY HH12:MI AM'),
        'ticket',         jsonb_build_object(
          'buyerName', v_ticket.buyer_name,
          'event',     (SELECT name FROM public.events WHERE id = v_ticket.event_id),
          'seat',      v_ticket.seat_number,
          'category',  (SELECT name FROM public.seat_categories WHERE id = v_ticket.seat_category_id)
        )
      );
    END IF;

    UPDATE public.tickets
    SET scanned    = true,
        scanned_at = NOW()
    WHERE id = v_ticket.id;

    SELECT e.name, e.venue INTO v_event_name, v_venue
    FROM public.events e WHERE e.id = v_ticket.event_id;

    SELECT sc.name INTO v_cat_name
    FROM public.seat_categories sc WHERE sc.id = v_ticket.seat_category_id;

    RETURN jsonb_build_object(
      'valid',   true,
      'message', '✅ Ticket verified — welcome!',
      'ticket',  jsonb_build_object(
        'buyerName', v_ticket.buyer_name,
        'event',     v_event_name,
        'venue',     v_venue,
        'seat',      v_ticket.seat_number,
        'category',  v_cat_name
      )
    );

  END IF;

END;
$$;

-- Lock down RPC to service_role only (backend uses service key)
REVOKE ALL ON FUNCTION public.admin_verify_ticket_by_qr(TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_verify_ticket_by_qr(TEXT) TO service_role;
