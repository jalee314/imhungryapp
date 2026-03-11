-- Performance Optimizations Migration
-- P0: Pre-aggregate view_count on deal_instance to eliminate expensive LEFT JOIN
-- P1: Add get_discover_restaurants_with_images RPC to collapse 7 queries into 1

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- P0: MATERIALIZED VIEW_COUNT ON deal_instance
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add the cached view_count column (defaults to 0 for existing rows)
ALTER TABLE public.deal_instance
  ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0;

-- 2. Backfill from current interaction data
UPDATE public.deal_instance AS di
SET view_count = sub.cnt
FROM (
  SELECT i.deal_id, COUNT(*) AS cnt
  FROM public.interaction AS i
  WHERE i.interaction_type = 'click-open'
  GROUP BY i.deal_id
) AS sub
WHERE di.deal_id = sub.deal_id;

-- 3. Index for quick lookups (used by quality scoring)
CREATE INDEX IF NOT EXISTS idx_deal_instance_view_count
  ON public.deal_instance (view_count);

-- 4. Trigger function to keep view_count in sync on new click-open interactions
CREATE OR REPLACE FUNCTION public.increment_deal_view_count()
  RETURNS trigger
  LANGUAGE plpgsql
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

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS trg_increment_deal_view_count ON public.interaction;

CREATE TRIGGER trg_increment_deal_view_count
  AFTER INSERT ON public.interaction
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_deal_view_count();

-- 5. Handle interaction deletes (e.g. admin cleanup) — decrement view_count
CREATE OR REPLACE FUNCTION public.decrement_deal_view_count()
  RETURNS trigger
  LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS trg_decrement_deal_view_count ON public.interaction;

CREATE TRIGGER trg_decrement_deal_view_count
  AFTER DELETE ON public.interaction
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_deal_view_count();

-- 6. Update nearby_deals to read the pre-aggregated column (removing the expensive LEFT JOIN)
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
        -- Use the pre-aggregated column instead of a LEFT JOIN on interaction
        d.view_count,
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


-- ═══════════════════════════════════════════════════════════════════════════════
-- P1: SINGLE RPC FOR DISCOVER TAB
-- Collapses restaurant fetch + deal counts + distances + most-liked images
-- into a single database round-trip.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_discover_restaurants_with_images(
  user_lat double precision,
  user_lng double precision,
  max_distance_miles double precision DEFAULT 31
)
RETURNS TABLE(
  restaurant_id uuid,
  name varchar,
  address varchar,
  deal_count bigint,
  distance_miles numeric,
  lat double precision,
  lng double precision,
  best_deal_image_url text
)
LANGUAGE plpgsql
STABLE
SET search_path = 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  WITH restaurant_deals AS (
    -- Get restaurants + deal counts in one pass
    SELECT
      dt.restaurant_id,
      COUNT(DISTINCT di.deal_id) AS deal_count
    FROM public.deal_instance AS di
    INNER JOIN public.deal_template AS dt ON di.template_id = dt.template_id
    WHERE dt.restaurant_id IS NOT NULL
      AND di.start_date <= now()
      AND (di.end_date IS NULL OR di.end_date >= now())
    GROUP BY dt.restaurant_id
  ),
  restaurant_info AS (
    -- Get restaurant details + calculated distance
    SELECT
      r.restaurant_id,
      r.name,
      r.address,
      rd.deal_count,
      ROUND(
        CAST(
          ST_Distance(
            r.location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
          ) * 0.000621371 AS numeric
        ),
        1
      ) AS distance_miles,
      ST_Y(r.location::geometry) AS lat,
      ST_X(r.location::geometry) AS lng
    FROM public.restaurant AS r
    INNER JOIN restaurant_deals AS rd ON r.restaurant_id = rd.restaurant_id
    WHERE r.location IS NOT NULL
  ),
  -- Find the most-upvoted deal per restaurant for the cover image
  deal_upvotes AS (
    SELECT
      dt.restaurant_id,
      dt.template_id,
      di.deal_id,
      COALESCE(di.view_count, 0) AS vc
    FROM public.deal_template AS dt
    INNER JOIN public.deal_instance AS di ON dt.template_id = di.template_id
    WHERE dt.restaurant_id IN (SELECT ri.restaurant_id FROM restaurant_info AS ri)
  ),
  ranked_deals AS (
    SELECT
      du.restaurant_id,
      du.template_id,
      ROW_NUMBER() OVER (PARTITION BY du.restaurant_id ORDER BY du.vc DESC) AS rn
    FROM deal_upvotes AS du
  ),
  best_images AS (
    SELECT
      rd2.restaurant_id,
      COALESCE(
        -- Priority 1: first deal_image by display_order
        (
          SELECT (dim.variants->>'medium')
          FROM public.deal_images AS dimg
          INNER JOIN public.image_metadata AS dim ON dimg.image_metadata_id = dim.image_metadata_id
          WHERE dimg.deal_template_id = rd2.template_id
            AND dim.variants IS NOT NULL
          ORDER BY dimg.display_order ASC
          LIMIT 1
        ),
        -- Priority 2: deal_template's own image_metadata
        (
          SELECT (im2.variants->>'medium')
          FROM public.deal_template AS dt2
          INNER JOIN public.image_metadata AS im2 ON dt2.image_metadata_id = im2.image_metadata_id
          WHERE dt2.template_id = rd2.template_id
            AND im2.variants IS NOT NULL
          LIMIT 1
        ),
        -- Priority 3: deal_template.image_url fallback
        (
          SELECT dt3.image_url
          FROM public.deal_template AS dt3
          WHERE dt3.template_id = rd2.template_id
            AND dt3.image_url IS NOT NULL
          LIMIT 1
        )
      ) AS best_deal_image_url
    FROM ranked_deals AS rd2
    WHERE rd2.rn = 1
  )
  SELECT
    ri.restaurant_id,
    ri.name,
    ri.address,
    ri.deal_count,
    ri.distance_miles,
    ri.lat,
    ri.lng,
    COALESCE(bi.best_deal_image_url, '') AS best_deal_image_url
  FROM restaurant_info AS ri
  LEFT JOIN best_images AS bi ON ri.restaurant_id = bi.restaurant_id
  WHERE ri.distance_miles <= max_distance_miles
  ORDER BY ri.distance_miles ASC;
END;
$function$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_discover_restaurants_with_images(double precision, double precision, double precision)
  TO authenticated, service_role;

COMMIT;
