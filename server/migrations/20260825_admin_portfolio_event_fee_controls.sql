-- Faisalabad Times: manual portfolio ordering, protected past-event cleanup,
-- and per-seat-category service fees.
-- Run once in the connected Supabase SQL Editor before deploying the matching code.

ALTER TABLE public.seat_categories
  ADD COLUMN IF NOT EXISTS service_fee NUMERIC(10,2);

UPDATE public.seat_categories
SET service_fee = 220
WHERE service_fee IS NULL;

ALTER TABLE public.seat_categories
  ALTER COLUMN service_fee SET DEFAULT 220,
  ALTER COLUMN service_fee SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seat_categories_service_fee_nonnegative'
      AND conrelid = 'public.seat_categories'::regclass
  ) THEN
    ALTER TABLE public.seat_categories
      ADD CONSTRAINT seat_categories_service_fee_nonnegative
      CHECK (service_fee >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_portfolio_order(p_item_ids UUID[])
RETURNS SETOF public.portfolio_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_count INTEGER;
  supplied_count INTEGER;
  unique_count INTEGER;
  position INTEGER;
BEGIN
  supplied_count := COALESCE(cardinality(p_item_ids), 0);
  SELECT COUNT(*) INTO expected_count FROM public.portfolio_items;
  SELECT COUNT(DISTINCT id) INTO unique_count FROM unnest(p_item_ids) AS id;

  IF supplied_count <> expected_count OR unique_count <> expected_count THEN
    RAISE EXCEPTION 'Portfolio ordering request must contain every project exactly once';
  END IF;

  PERFORM 1 FROM public.portfolio_items WHERE id = ANY(p_item_ids) FOR UPDATE;

  FOR position IN 1..supplied_count LOOP
    UPDATE public.portfolio_items
    SET display_order = position - 1
    WHERE id = p_item_ids[position];
  END LOOP;

  RETURN QUERY
  SELECT *
  FROM public.portfolio_items
  ORDER BY display_order ASC, created_at ASC, id ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_past_event(p_event_id UUID)
RETURNS TABLE (
  deleted_event_id UUID,
  deleted_tickets INTEGER,
  deleted_purchases INTEGER,
  deleted_categories INTEGER,
  deleted_orders INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_event public.events%ROWTYPE;
  ticket_count INTEGER := 0;
  purchase_count INTEGER := 0;
  category_count INTEGER := 0;
  order_count INTEGER := 0;
BEGIN
  SELECT * INTO target_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF target_event.is_active OR target_event.date >= NOW() THEN
    RAISE EXCEPTION 'Only hidden past events can be permanently deleted';
  END IF;

  DELETE FROM public.tickets WHERE event_id = p_event_id;
  GET DIAGNOSTICS ticket_count = ROW_COUNT;

  DELETE FROM public.purchases WHERE event_id = p_event_id;
  GET DIAGNOSTICS purchase_count = ROW_COUNT;

  IF to_regclass('public.orders') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.orders WHERE event_id = $1' USING p_event_id;
    GET DIAGNOSTICS order_count = ROW_COUNT;
  END IF;

  DELETE FROM public.seat_categories WHERE event_id = p_event_id;
  GET DIAGNOSTICS category_count = ROW_COUNT;

  DELETE FROM public.events WHERE id = p_event_id;

  RETURN QUERY SELECT p_event_id, ticket_count, purchase_count, category_count, order_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_portfolio_order(UUID[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_past_event(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_portfolio_order(UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_past_event(UUID) TO service_role;
