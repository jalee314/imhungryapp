-- =============================================================================
-- Migration: Fix Supabase Security Lints
-- Date: 2026-03-10
--
-- Fixes:
--   [ERROR] Security Definer Views  – 2 views
--   [ERROR] RLS Disabled in Public  – 8 tables
--   [WARN]  Function Search Path Mutable – 16 functions
--   [WARN]  Extensions in Public – 3 extensions (postgis, postgis_sfcgal, vector)
--
-- Auth-level warnings (OTP expiry, leaked-password protection) must be fixed
-- in the Supabase Dashboard → Authentication → Settings, not via migration.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS IN PUBLIC (postgis, postgis_sfcgal, vector)
--    PostGIS does not support ALTER EXTENSION ... SET SCHEMA.
--    These warnings must be accepted or the extensions recreated in a new
--    schema from scratch (destructive). Leaving as-is for now.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FIX SECURITY-DEFINER VIEWS → SECURITY INVOKER
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a. deal_feed_view  (not referenced by app code – safe to recreate)
DROP VIEW IF EXISTS public.deal_feed_view;
CREATE VIEW public.deal_feed_view
  WITH (security_invoker = on)
AS
  SELECT
    template_id AS deal_id,
    title,
    description,
    image_url,
    image_metadata_id
  FROM public.deal_template dt;

-- 2b. restaurants_with_coords  (used by locationService, discoverService, DataCacheStore)
DROP VIEW IF EXISTS public.restaurants_with_coords;
CREATE VIEW public.restaurants_with_coords
  WITH (security_invoker = on)
AS
  SELECT
    restaurant_id,
    name,
    address,
    restaurant_image_metadata,
    brand_id,
    created_at,
    public.st_y((location)::public.geometry) AS lat,
    public.st_x((location)::public.geometry) AS lng
  FROM public.restaurant
  WHERE location IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ENABLE RLS + ADD POLICIES ON UNPROTECTED PUBLIC TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. brand (read-only lookup table)
ALTER TABLE public.brand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read brands"
  ON public.brand FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage brands"
  ON public.brand FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3b. category (read-only lookup table)
ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON public.category FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.category FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3c. cuisine (read-only lookup table)
ALTER TABLE public.cuisine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cuisines"
  ON public.cuisine FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage cuisines"
  ON public.cuisine FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3d. reason_code (read-only lookup table)
ALTER TABLE public.reason_code ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reason codes"
  ON public.reason_code FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage reason codes"
  ON public.reason_code FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3e. restaurant (core table – reads public, inserts by authenticated users)
ALTER TABLE public.restaurant ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read restaurants"
  ON public.restaurant FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert restaurants"
  ON public.restaurant FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update restaurants"
  ON public.restaurant FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete restaurants"
  ON public.restaurant FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3f. restaurant_cuisine (junction table)
ALTER TABLE public.restaurant_cuisine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read restaurant cuisines"
  ON public.restaurant_cuisine FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert restaurant cuisines"
  ON public.restaurant_cuisine FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage restaurant cuisines"
  ON public.restaurant_cuisine FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3g. image_metadata (reads public, inserts by authenticated users)
ALTER TABLE public.image_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read image metadata"
  ON public.image_metadata FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert image metadata"
  ON public.image_metadata FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update image metadata"
  ON public.image_metadata FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete image metadata"
  ON public.image_metadata FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3h. spatial_ref_sys — skipped
--     PostGIS system table owned by supabase_admin; cannot alter via migration.
--     This lint warning can be safely accepted.

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FIX MUTABLE SEARCH_PATH ON ALL 16 FLAGGED FUNCTIONS
--    We add  SET search_path = 'public', 'extensions'  so PostGIS helpers
--    and auth.uid() resolve correctly.
-- ─────────────────────────────────────────────────────────────────────────────

-- 4a. check_email_exists
CREATE OR REPLACE FUNCTION public.check_email_exists(email_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."user"
    WHERE email = email_input
  );
END;
$function$;

-- 4b. check_phone_exists
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."user"
    WHERE phone_number = phone_input
  );
END;
$function$;

-- 4c. check_username_exists
CREATE OR REPLACE FUNCTION public.check_username_exists(username_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."user"
    WHERE display_name = username_input
  );
END;
$function$;

-- 4d. create_deal_instance_trigger
CREATE OR REPLACE FUNCTION public.create_deal_instance_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  INSERT INTO public.deal_instance (template_id, start_date, end_date, is_anonymous)
  VALUES (NEW.template_id, NOW(), NULL, NEW.is_anonymous);
  RETURN NEW;
END;
$function$;

-- 4e. get_blocked_user_ids
CREATE OR REPLACE FUNCTION public.get_blocked_user_ids(p_user_id uuid)
 RETURNS TABLE(user_id uuid)
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.blocked_user_id
  FROM
    public.user_block AS t
  WHERE
    t.blocker_user_id = p_user_id;
END;
$function$;

-- 4f. get_deal_report_counts
CREATE OR REPLACE FUNCTION public.get_deal_report_counts(deal_ids uuid[])
 RETURNS TABLE(deal_id uuid, report_count bigint)
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ur.deal_id,
    count(*) AS report_count
  FROM
    public.user_report AS ur
  WHERE
    ur.deal_id = ANY(deal_ids)
  GROUP BY
    ur.deal_id;
END;
$function$;

-- 4g. get_or_create_restaurant
CREATE OR REPLACE FUNCTION public.get_or_create_restaurant(
  p_google_place_id text,
  p_name text,
  p_address text,
  p_lat double precision,
  p_lng double precision
)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
DECLARE
  v_restaurant_id UUID;
  v_brand_id UUID;
  v_location GEOMETRY;
  v_clean_name TEXT;
  v_best_match_score INTEGER := 0;
  v_best_brand_id UUID;
  v_brand_name TEXT;
  v_match_score INTEGER;
BEGIN
  v_clean_name := LOWER(TRIM(p_name));

  -- 1. Check if restaurant exists by google_place_id
  IF p_google_place_id IS NOT NULL THEN
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.restaurant
    WHERE google_place_id = p_google_place_id
    LIMIT 1;

    IF v_restaurant_id IS NOT NULL THEN
      RETURN v_restaurant_id;
    END IF;
  END IF;

  -- 2. Enhanced brand matching
  -- Strategy 1: Exact match
  SELECT brand_id, name INTO v_brand_id, v_brand_name
  FROM public.brand
  WHERE LOWER(TRIM(name)) = v_clean_name
  LIMIT 1;

  IF v_brand_id IS NULL THEN
    -- Strategy 2: Restaurant name contains brand name
    FOR v_brand_id, v_brand_name IN
      SELECT brand_id, name
      FROM public.brand
      WHERE LENGTH(TRIM(name)) >= 3
        AND v_clean_name LIKE '%' || LOWER(TRIM(name)) || '%'
      ORDER BY LENGTH(name) DESC
    LOOP
      v_match_score := LENGTH(v_brand_name);
      IF v_match_score > v_best_match_score THEN
        v_best_match_score := v_match_score;
        v_best_brand_id := v_brand_id;
      END IF;
    END LOOP;

    -- Strategy 3: Brand name contains restaurant name
    IF v_best_brand_id IS NULL THEN
      FOR v_brand_id, v_brand_name IN
        SELECT brand_id, name
        FROM public.brand
        WHERE LENGTH(TRIM(name)) >= 3
          AND LOWER(TRIM(name)) LIKE '%' || v_clean_name || '%'
        ORDER BY LENGTH(name) ASC
      LOOP
        v_match_score := LENGTH(v_clean_name);
        IF v_match_score > v_best_match_score THEN
          v_best_match_score := v_match_score;
          v_best_brand_id := v_brand_id;
        END IF;
      END LOOP;
    END IF;

    IF v_best_brand_id IS NOT NULL THEN
      v_brand_id := v_best_brand_id;
    END IF;
  END IF;

  -- 3. Create PostGIS point
  v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);

  -- 4. Insert new restaurant
  INSERT INTO public.restaurant (
    name, address, location, brand_id, google_place_id, source
  ) VALUES (
    p_name, p_address, v_location, v_brand_id, p_google_place_id, 'google_places'
  )
  RETURNING restaurant_id INTO v_restaurant_id;

  RETURN v_restaurant_id;

EXCEPTION
  WHEN unique_violation THEN
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.restaurant
    WHERE google_place_id = p_google_place_id
    LIMIT 1;
    RETURN v_restaurant_id;
  WHEN OTHERS THEN
    RAISE;
END;
$function$;

-- 4h. get_restaurant_coords_with_distance
CREATE OR REPLACE FUNCTION public.get_restaurant_coords_with_distance(
  restaurant_ids uuid[],
  user_uuid uuid DEFAULT NULL::uuid,
  ref_lat double precision DEFAULT NULL::double precision,
  ref_lng double precision DEFAULT NULL::double precision
)
 RETURNS TABLE(restaurant_id uuid, lat double precision, lng double precision, distance_miles double precision)
 LANGUAGE plpgsql
 STABLE
 SET search_path = 'public', 'extensions'
AS $function$
DECLARE
  reference_location geography;
BEGIN
  IF restaurant_ids IS NULL OR array_length(restaurant_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  IF ref_lat IS NOT NULL AND ref_lng IS NOT NULL THEN
    reference_location := ST_SetSRID(ST_MakePoint(ref_lng, ref_lat), 4326)::geography;
  ELSIF user_uuid IS NOT NULL THEN
    SELECT location INTO reference_location
    FROM public."user"
    WHERE user_id = user_uuid;
  END IF;

  RETURN QUERY
  SELECT
    r.restaurant_id,
    ST_Y(r.location::geometry) AS lat,
    ST_X(r.location::geometry) AS lng,
    CASE
      WHEN reference_location IS NULL THEN NULL
      ELSE (ST_Distance(r.location, reference_location) / 1609.34)::double precision
    END AS distance_miles
  FROM public.restaurant r
  WHERE r.restaurant_id = ANY(restaurant_ids)
    AND r.location IS NOT NULL;
END;
$function$;

-- 4i. get_restaurants_with_deal_counts
CREATE OR REPLACE FUNCTION public.get_restaurants_with_deal_counts(
  user_lat double precision,
  user_lng double precision
)
 RETURNS TABLE(
   restaurant_id uuid,
   name character varying,
   address character varying,
   restaurant_image_metadata uuid,
   deal_count bigint,
   distance_miles numeric,
   lat double precision,
   lng double precision
 )
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  WITH restaurant_deal_counts AS (
    SELECT
      dt.restaurant_id,
      COUNT(di.deal_id) as deal_count
    FROM public.deal_instance di
    INNER JOIN public.deal_template dt ON di.template_id = dt.template_id
    WHERE dt.restaurant_id IS NOT NULL
    GROUP BY dt.restaurant_id
  ),
  restaurant_locations AS (
    SELECT
      r.restaurant_id,
      r.name,
      r.address,
      r.restaurant_image_metadata,
      ST_X(r.location::geometry) as lng,
      ST_Y(r.location::geometry) as lat
    FROM public.restaurant r
    WHERE r.location IS NOT NULL
  )
  SELECT
    rl.restaurant_id,
    rl.name,
    rl.address,
    rl.restaurant_image_metadata,
    rdc.deal_count,
    ROUND(
      CAST(
        ST_Distance(
          ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
          ST_GeogFromText('POINT(' || rl.lng || ' ' || rl.lat || ')')
        ) * 0.000621371 AS numeric
      ),
      1
    ) as distance_miles,
    rl.lat,
    rl.lng
  FROM restaurant_locations rl
  INNER JOIN restaurant_deal_counts rdc ON rl.restaurant_id = rdc.restaurant_id
  WHERE rdc.deal_count > 0
  ORDER BY distance_miles ASC;
END;
$function$;

-- 4j. get_user_cuisine_preferences
CREATE OR REPLACE FUNCTION public.get_user_cuisine_preferences(p_user_id uuid)
 RETURNS TABLE(cuisine_id uuid)
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.cuisine_id
  FROM
    public.user_cuisine_preference AS t
  WHERE
    t.user_id = p_user_id;
END;
$function$;

-- 4k. get_user_location_coords
CREATE OR REPLACE FUNCTION public.get_user_location_coords(user_uuid uuid)
 RETURNS TABLE(lat double precision, lng double precision, city text, state text)
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ST_Y(u.location::geometry) as lat,
    ST_X(u.location::geometry) as lng,
    u.location_city::text as city,
    u.location_state::text as state
  FROM public."user" u
  WHERE u.user_id = user_uuid
    AND u.location IS NOT NULL;
END;
$function$;

-- 4l. nearby_deals
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
        AND (d.end_date IS NULL OR d.end_date >= now());
END;
$function$;

-- 4m. prevent_banned_or_suspended_users_from_posting
CREATE OR REPLACE FUNCTION public.prevent_banned_or_suspended_users_from_posting()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
DECLARE
  v_is_banned BOOLEAN;
  v_is_suspended BOOLEAN;
  v_suspension_until TIMESTAMPTZ;
BEGIN
  SELECT is_banned, is_suspended, suspension_until
  INTO v_is_banned, v_is_suspended, v_suspension_until
  FROM public."user"
  WHERE user_id = NEW.user_id;

  IF v_is_banned THEN
    RAISE EXCEPTION 'Banned users cannot create deals';
  END IF;

  IF v_is_suspended THEN
    IF v_suspension_until IS NULL OR v_suspension_until > NOW() THEN
      RAISE EXCEPTION 'Suspended users cannot create deals until %', v_suspension_until;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4n. set_user_report_updated_at
CREATE OR REPLACE FUNCTION public.set_user_report_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 4o. update_restaurant_updated_at
CREATE OR REPLACE FUNCTION public.update_restaurant_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 4p. update_user_location
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
  UPDATE public."user"
  SET
    location = ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
    location_city = COALESCE(city, location_city),
    location_state = COALESCE(state, location_state)
  WHERE user_id = user_uuid;
END;
$function$;

COMMIT;
