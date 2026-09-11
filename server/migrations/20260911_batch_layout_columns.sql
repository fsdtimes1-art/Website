-- Migration: 20260911_batch_layout_columns
-- Adds QR layout columns to physical_ticket_batches so the
-- position set in the admin generator is persisted and reused
-- on every PDF download from Overview.

ALTER TABLE physical_ticket_batches
  ADD COLUMN IF NOT EXISTS qr_x        numeric DEFAULT 76,
  ADD COLUMN IF NOT EXISTS qr_y        numeric DEFAULT 15,
  ADD COLUMN IF NOT EXISTS qr_size     numeric DEFAULT 24,
  ADD COLUMN IF NOT EXISTS ticket_w    numeric DEFAULT 180,
  ADD COLUMN IF NOT EXISTS ticket_h    numeric DEFAULT 70,
  ADD COLUMN IF NOT EXISTS serial_align text    DEFAULT 'below';

COMMENT ON COLUMN physical_ticket_batches.qr_x        IS 'QR left edge as % of ticket width';
COMMENT ON COLUMN physical_ticket_batches.qr_y        IS 'QR top edge as % of ticket height';
COMMENT ON COLUMN physical_ticket_batches.qr_size     IS 'QR code size in mm';
COMMENT ON COLUMN physical_ticket_batches.ticket_w    IS 'Ticket width in mm';
COMMENT ON COLUMN physical_ticket_batches.ticket_h    IS 'Ticket height in mm';
COMMENT ON COLUMN physical_ticket_batches.serial_align IS 'Serial number position relative to QR: above or below';

-- Clear any cached PDFs on existing batches so next download regenerates correctly
UPDATE physical_ticket_batches SET pdf_url = NULL;
