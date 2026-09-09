-- ============================================================
-- Faisalabad Times: Physical Ticketing — Hotfix
-- Run ONCE in Supabase SQL Editor.
-- Fixes: (1) storage bucket 100MB limit  (2) orphaned tickets cleanup
-- ============================================================

-- ── FIX 1: Update bucket to 100 MB limit ──────────────────────
-- Original migration used ON CONFLICT DO NOTHING so dashboard-created
-- buckets never got the correct size limit applied.
UPDATE storage.buckets
SET
  file_size_limit    = 104857600,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf']
WHERE id = 'physical-ticket-templates';

-- ── FIX 2: Delete orphaned physical_tickets ───────────────────
-- Clears tickets whose batch was deleted without CASCADE.
DELETE FROM public.physical_tickets
WHERE batch_id NOT IN (
  SELECT id FROM public.physical_ticket_batches
);

-- Confirm
SELECT
  (SELECT COUNT(*) FROM public.physical_ticket_batches) AS batches_remaining,
  (SELECT COUNT(*) FROM public.physical_tickets)        AS tickets_remaining;
