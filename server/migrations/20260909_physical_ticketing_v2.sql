-- ============================================================
-- Faisalabad Times: Physical Ticket Security Upgrade + E-Ticket Void
-- Run ONCE in Supabase SQL Editor AFTER 20260909_physical_ticketing.sql
-- All changes are additive — no existing data is altered.
-- ============================================================

-- ── 1. E-TICKET VOID COLUMN ──────────────────────────────────
-- Allows admin to void a purchased ticket (e.g. after refund)
-- without deleting the purchase record.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS voided BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS voided_by TEXT;

-- Index so we can filter quickly
CREATE INDEX IF NOT EXISTS idx_tickets_voided ON public.tickets(voided);

-- ── 2. PHYSICAL TICKET QR TOKEN SECURITY UPGRADE ─────────────
-- IMPORTANT: qr_token now stores a cryptographic UUID (separate from
-- serial_code). The QR encodes the UUID. serial_code is human-readable
-- text only. This prevents forgery: knowing the serial does NOT help
-- you construct a valid QR code.
-- NOTE: Existing physical_tickets rows will have serial_code = qr_token.
-- New rows created by the updated physicalTicketService.js will have
-- qr_token = uuid() (different from serial_code). This migration
-- adds a comment but no schema change is needed — column already exists.

-- ── 3. UNIFIED VERIFY RPC (replaces previous version) ────────
-- Now searches BOTH tables by UUID, no PT- prefix detection needed.
-- physical_tickets.qr_token = UUID (random, secure)
-- tickets.qr_code            = UUID (original, online e-tickets)
-- Also checks tickets.voided before allowing entry.

CREATE OR REPLACE FUNCTION public.admin_verify_ticket_by_qr(p_qr TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phys        public.physical_tickets%ROWTYPE;
  v_ticket      public.tickets%ROWTYPE;
  v_event_name  TEXT;
  v_venue       TEXT;
  v_cat_name    TEXT;
BEGIN

  -- ── Case A: Physical Ticket ─────────────────────────────────
  -- qr_token is a UUID (opaque, not the serial code)
  SELECT pt.* INTO v_phys
  FROM public.physical_tickets pt
  WHERE pt.qr_token = p_qr
  FOR UPDATE;

  IF FOUND THEN

    IF v_phys.status = 'inactive' THEN
      RETURN jsonb_build_object(
        'valid',        false,
        'ticketType',   'physical',
        'message',      '❌ Ticket not yet activated / sold'
      );
    END IF;

    IF v_phys.status = 'void' THEN
      RETURN jsonb_build_object(
        'valid',        false,
        'ticketType',   'physical',
        'message',      '❌ Ticket has been cancelled / void'
      );
    END IF;

    IF v_phys.scanned THEN
      RETURN jsonb_build_object(
        'valid',          false,
        'alreadyScanned', true,
        'ticketType',     'physical',
        'message',        '❌ Already scanned at ' || to_char(v_phys.scanned_at AT TIME ZONE 'Asia/Karachi', 'DD Mon YYYY HH12:MI AM'),
        'ticket',         jsonb_build_object(
          'buyerName',  'Physical Ticket',
          'event',      (SELECT name FROM public.events WHERE id = v_phys.event_id),
          'seat',       v_phys.serial_code,
          'category',   (SELECT name FROM public.seat_categories WHERE id = v_phys.seat_category_id)
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
      'valid',       true,
      'ticketType',  'physical',
      'message',     '✅ Ticket verified — Physical Ticket ' || v_phys.serial_code,
      'ticket',      jsonb_build_object(
        'buyerName', 'Physical Ticket',
        'event',     v_event_name,
        'venue',     v_venue,
        'seat',      v_phys.serial_code,
        'category',  v_cat_name
      )
    );

  END IF;

  -- ── Case B: Online E-Ticket ─────────────────────────────────
  SELECT t.* INTO v_ticket
  FROM public.tickets t
  WHERE t.qr_code = p_qr
  FOR UPDATE;

  IF FOUND THEN

    -- Voided check (new)
    IF v_ticket.voided THEN
      RETURN jsonb_build_object(
        'valid',       false,
        'ticketType',  'eticket',
        'message',     '❌ Ticket has been voided — entry not permitted',
        'ticket',      jsonb_build_object(
          'buyerName', v_ticket.buyer_name,
          'event',     (SELECT name FROM public.events WHERE id = v_ticket.event_id),
          'seat',      v_ticket.seat_number,
          'category',  (SELECT name FROM public.seat_categories WHERE id = v_ticket.seat_category_id)
        )
      );
    END IF;

    IF v_ticket.scanned THEN
      RETURN jsonb_build_object(
        'valid',          false,
        'alreadyScanned', true,
        'ticketType',     'eticket',
        'message',        '❌ Ticket already scanned at ' || to_char(v_ticket.scanned_at AT TIME ZONE 'Asia/Karachi', 'DD Mon YYYY HH12:MI AM'),
        'ticket',         jsonb_build_object(
          'buyerName', v_ticket.buyer_name,
          'event',     (SELECT name FROM public.events WHERE id = v_ticket.event_id),
          'seat',      v_ticket.seat_number,
          'category',  (SELECT name FROM public.seat_categories WHERE id = v_ticket.seat_category_id)
        )
      );
    END IF;

    -- Valid — mark scanned
    UPDATE public.tickets
    SET scanned    = true,
        scanned_at = NOW()
    WHERE id = v_ticket.id;

    SELECT e.name, e.venue INTO v_event_name, v_venue
    FROM public.events e WHERE e.id = v_ticket.event_id;

    SELECT sc.name INTO v_cat_name
    FROM public.seat_categories sc WHERE sc.id = v_ticket.seat_category_id;

    RETURN jsonb_build_object(
      'valid',      true,
      'ticketType', 'eticket',
      'message',    '✅ Ticket verified — welcome!',
      'ticket',     jsonb_build_object(
        'buyerName', v_ticket.buyer_name,
        'event',     v_event_name,
        'venue',     v_venue,
        'seat',      v_ticket.seat_number,
        'category',  v_cat_name
      )
    );

  END IF;

  -- ── Not found in either table ───────────────────────────────
  RETURN jsonb_build_object(
    'valid',   false,
    'message', '❌ Invalid ticket — QR code not recognised'
  );

END;
$$;

REVOKE ALL ON FUNCTION public.admin_verify_ticket_by_qr(TEXT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_verify_ticket_by_qr(TEXT) TO service_role;
