-- Fix: grant trigger functions SECURITY DEFINER so they can UPDATE deal_instance
-- regardless of the caller's RLS policies. Without this, logging an interaction
-- as an authenticated user fails with "permission denied for table deal_instance"
-- because the trigger runs in the caller's context.

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_deal_view_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public', 'extensions'
AS $fn$
BEGIN
  IF NEW.interaction_type = 'click-open' THEN
    UPDATE public.deal_instance
    SET view_count = view_count + 1
    WHERE deal_id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.decrement_deal_view_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public', 'extensions'
AS $fn$
BEGIN
  IF OLD.interaction_type = 'click-open' THEN
    UPDATE public.deal_instance
    SET view_count = GREATEST(view_count - 1, 0)
    WHERE deal_id = OLD.deal_id;
  END IF;
  RETURN OLD;
END;
$fn$;

COMMIT;
