-- =============================================================================
-- Migration: Comprehensive Security Hardening
-- Date: 2026-03-10
--
-- Fixes:
--   1. CRITICAL – Revoke overly permissive anon GRANTs (21 tables)
--   2. CRITICAL – update_user_location: add auth.uid() ownership check
--   3. CRITICAL – Storage policies: remove unauthenticated uploads,
--                 scope delete/update to own files
--   4. NOTE    – check_email/phone/username_exists: kept anon-accessible
--               (required for signup/login UX; enumeration trade-off noted)
--   5. HIGH     – nearby_deals: filter out banned/suspended user deals
--
-- Edge function fixes (delete-auth-user, delete-cloudinary-images) are
-- code changes, not SQL — see the updated index.ts files.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. REVOKE OVERLY PERMISSIVE ANON GRANTS
--    anon should only be able to SELECT on public lookup tables and the
--    user table (for profile viewing). All writes must go through
--    authenticated role + RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- Revoke everything from anon on all public tables first
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Re-grant SELECT-only to anon on tables that need public read access
-- (login screens, onboarding, unauthenticated browsing)
GRANT SELECT ON public.brand TO anon;
GRANT SELECT ON public.category TO anon;
GRANT SELECT ON public.cuisine TO anon;
GRANT SELECT ON public.reason_code TO anon;
GRANT SELECT ON public.restaurant TO anon;
GRANT SELECT ON public.restaurant_cuisine TO anon;
GRANT SELECT ON public.deal_template TO anon;
GRANT SELECT ON public.deal_instance TO anon;
GRANT SELECT ON public.deal_images TO anon;
GRANT SELECT ON public.image_metadata TO anon;
GRANT SELECT ON public."user" TO anon;

-- Authenticated users need SELECT on the same tables plus write access
-- where RLS policies permit it.
-- NOTE: Supabase's default migration already grants to authenticated,
-- but we re-state explicitly for clarity after the REVOKE ALL.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Lookup / read-mostly tables: SELECT only
GRANT SELECT ON public.brand TO authenticated;
GRANT SELECT ON public.category TO authenticated;
GRANT SELECT ON public.cuisine TO authenticated;
GRANT SELECT ON public.reason_code TO authenticated;
GRANT SELECT ON public.spatial_ref_sys TO authenticated;

-- Tables where authenticated users need full CRUD (scoped by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public."user" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_template TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.deal_instance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_images TO authenticated;
GRANT SELECT, INSERT ON public.image_metadata TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorite TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interaction TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.session TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_block TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_cuisine_preference TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_report TO authenticated;
GRANT SELECT, INSERT ON public.admin_action_log TO authenticated;
GRANT SELECT, INSERT ON public.restaurant TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.restaurant_cuisine TO authenticated;

-- Admin updates on restaurant/image_metadata are handled by RLS is_admin() policies,
-- but the authenticated role needs the UPDATE grant for those to work
GRANT UPDATE ON public.restaurant TO authenticated;
GRANT UPDATE, DELETE ON public.image_metadata TO authenticated;

-- Views (REVOKE ALL ON ALL TABLES also affects views)
GRANT SELECT ON public.deal_feed_view TO anon, authenticated;
GRANT SELECT ON public.restaurants_with_coords TO anon, authenticated;

-- Sequences: authenticated users need USAGE to insert rows with serial/uuid defaults
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FIX update_user_location – ADD auth.uid() OWNERSHIP CHECK
--    Previously any authenticated user could update any other user's location.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_user_location(
  user_uuid uuid,
  lat numeric,
  lng numeric,
  city text DEFAULT NULL::text,
  state text DEFAULT NULL::text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  -- Only allow users to update their own location
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden: cannot update another user''s location';
  END IF;

  UPDATE public."user"
  SET
    location = ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
    location_city = COALESCE(city, location_city),
    location_state = COALESCE(state, location_state)
  WHERE user_id = user_uuid;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FIX STORAGE POLICIES
--    Remove unauthenticated upload policies. Scope delete/update to own files.
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. Drop the overly permissive policies
-- These allow anon (unauthenticated) INSERT to deal-images and avatars
DROP POLICY IF EXISTS "Anyone can upload an avatar. 148yprt_0" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;

-- These allow ANY authenticated user to delete/update ANY file in avatars
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;

-- This is overly broad — duplicate of the scoped policy
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;

-- 3b. Replace with properly scoped policies

-- Avatars: users can only delete their own files (files in their user-id folder)
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatars: users can only update their own files
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. check_email/phone/username_exists — USER ENUMERATION TRADE-OFF
--
--    These SECURITY DEFINER functions are called from the SignUp screen and
--    login flow (pre-auth), so they MUST remain accessible to anon.
--    User enumeration is an accepted trade-off for signup UX.
--
--    Mitigations already in place:
--    - Supabase's built-in rate limiting on RPCs
--    - Functions only return boolean, not user data
--
--    Future improvement: wrap in an edge function with custom rate limiting.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FIX nearby_deals – FILTER OUT BANNED/SUSPENDED USERS' DEALS
--    Direct RPC callers previously saw deals from banned users.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.nearby_deals(
  lat double precision,
  long double precision,
  radius_miles double precision
)
 RETURNS TABLE(
   deal_id uuid,
   template_id uuid,
   created_at timestamp with time zone,
   is_anonymous boolean,
   start_date timestamp with time zone,
   end_date timestamp with time zone,
   distance_miles double precision,
   view_count bigint,
   deal_template json
 )
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
DECLARE
    radius_meters float;
    user_location geography;
BEGIN
    radius_meters := radius_miles * 1609.34;
    user_location := ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography;

    RETURN QUERY
    SELECT
        d.deal_id,
        d.template_id,
        d.created_at,
        d.is_anonymous,
        d.start_date,
        d.end_date,
        (ST_Distance(r.location, user_location) / 1609.34)::float AS distance_miles,
        COALESCE(deal_clicks.click_count, 0) AS view_count,
        json_build_object(
            'template_id', dt.template_id,
            'user_id', dt.user_id,
            'cuisine_id', dt.cuisine_id,
            'restaurant_id', dt.restaurant_id,
            'title', dt.title,
            'description', dt.description
        ) AS deal_template
    FROM
        public.restaurant AS r
    JOIN
        public.deal_template AS dt ON r.restaurant_id = dt.restaurant_id
    JOIN
        public.deal_instance AS d ON dt.template_id = d.template_id
    -- Filter out deals from banned or currently suspended users
    JOIN
        public."user" AS u ON dt.user_id = u.user_id
    LEFT JOIN (
        SELECT
            i.deal_id,
            COUNT(*) AS click_count
        FROM
            public.interaction AS i
        WHERE
            i.interaction_type = 'click-open'
        GROUP BY
            i.deal_id
    ) AS deal_clicks ON d.deal_id = deal_clicks.deal_id
    WHERE
        ST_DWithin(r.location, user_location, radius_meters)
        AND d.start_date <= now()
        AND (d.end_date IS NULL OR d.end_date >= now())
        -- Exclude banned users
        AND COALESCE(u.is_banned, false) = false
        -- Exclude currently suspended users
        AND (
          COALESCE(u.is_suspended, false) = false
          OR (u.suspension_until IS NOT NULL AND u.suspension_until <= now())
        );
END;
$function$;

COMMIT;
