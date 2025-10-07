create extension if not exists "postgis" with schema "public" version '3.3.7';

create extension if not exists "postgis_sfcgal" with schema "public" version '3.3.7';

create extension if not exists "vector" with schema "public" version '0.8.0';

create type "public"."device_type_enum" as enum ('iOS', 'Android', 'Web');

create type "public"."image_type_enum" as enum ('profile_image', 'deal_image', 'restaurant_image', 'franchise_logo_image');

create type "public"."interaction_type_enum" as enum ('click-through', 'click-open', 'upvote', 'downvote', 'save', 'favorite', 'redemption_proxy', 'report', 'block', 'share');

create type "public"."resolution_action_enum" as enum ('keep', 'remove', 'warn_uploader', 'ban_uploader');

create type "public"."source_enum" as enum ('feed', 'search', 'notification', 'share_link', 'profile');

create type "public"."source_type_enum" as enum ('scraper', 'community_uploaded', 'google_places');

create type "public"."status_enum" as enum ('pending', 'review', 'resolved');

create table "public"."brand" (
    "brand_id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "logo_url" text,
    "logo_metadata_id" uuid
);


create table "public"."category" (
    "category_id" uuid not null default extensions.uuid_generate_v4(),
    "category_name" text not null
);


create table "public"."cuisine" (
    "cuisine_id" uuid not null default extensions.uuid_generate_v4(),
    "cuisine_name" text not null
);


create table "public"."deal_instance" (
    "deal_id" uuid not null default extensions.uuid_generate_v4(),
    "template_id" uuid not null,
    "is_anonymous" boolean not null default false,
    "start_date" timestamp with time zone not null default now(),
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."deal_instance" enable row level security;

create table "public"."deal_template" (
    "template_id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "category_id" uuid,
    "cuisine_id" uuid,
    "title" text not null,
    "description" text,
    "image_url" text,
    "source_type" source_type_enum,
    "discount_value" numeric(10,5),
    "created_at" timestamp with time zone not null default now(),
    "duplicate_flag" boolean default false,
    "is_anonymous" boolean default false,
    "restaurant_id" uuid not null,
    "image_metadata_id" uuid
);


alter table "public"."deal_template" enable row level security;

create table "public"."favorite" (
    "favorite_id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "deal_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "restaurant_id" uuid
);


alter table "public"."favorite" enable row level security;

create table "public"."image_metadata" (
    "image_metadata_id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "image_type" image_type_enum not null,
    "original_path" text not null,
    "variants" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "cloudinary_public_id" text not null
);


create table "public"."interaction" (
    "interaction_id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "deal_id" uuid,
    "session_id" uuid not null,
    "interaction_type" interaction_type_enum,
    "position_in_feed" integer,
    "dwell_time" integer,
    "created_at" timestamp with time zone not null default now(),
    "restaurant_id" uuid,
    "source" source_enum not null
);


alter table "public"."interaction" enable row level security;

create table "public"."notification" (
    "notification_id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "deal_id" uuid,
    "type" character varying(50) not null,
    "sent_at" timestamp with time zone not null default now(),
    "is_read" boolean not null default false
);


alter table "public"."notification" enable row level security;

create table "public"."reason_code" (
    "reason_code_id" uuid not null default extensions.uuid_generate_v4(),
    "reason_code" integer not null,
    "description" text
);


create table "public"."restaurant" (
    "restaurant_id" uuid not null default extensions.uuid_generate_v4(),
    "brand_id" uuid,
    "name" character varying(150) not null,
    "restaurant_image_metadata" uuid,
    "address" character varying(255) not null,
    "location" geography(Point,4326) not null,
    "created_at" timestamp with time zone not null default now(),
    "google_place_id" text,
    "source" source_type_enum not null default 'community_uploaded'::source_type_enum,
    "updated_at" timestamp with time zone default now()
);


create table "public"."restaurant_cuisine" (
    "restaurant_id" uuid not null,
    "cuisine_id" uuid not null
);


create table "public"."session" (
    "session_id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone,
    "device_type" device_type_enum,
    "app_version" text not null,
    "os_version" text not null,
    "location" geography(Point,4326)
);


alter table "public"."session" enable row level security;

create table "public"."user" (
    "user_id" uuid not null,
    "display_name" text not null,
    "email" character varying(255) not null,
    "phone_number" text,
    "profile_photo" character varying(255),
    "location_city" character varying(100),
    "location" geography(Point,4326),
    "created_at" timestamp with time zone not null default now(),
    "first_name" character varying,
    "last_name" character varying,
    "profile_photo_metadata_id" uuid
);


alter table "public"."user" enable row level security;

create table "public"."user_block" (
    "block_id" uuid not null default extensions.uuid_generate_v4(),
    "blocker_user_id" uuid not null,
    "blocked_user_id" uuid not null,
    "reason_code_id" uuid not null,
    "reason_text" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."user_block" enable row level security;

create table "public"."user_cuisine_preference" (
    "user_id" uuid not null,
    "cuisine_id" uuid not null
);


alter table "public"."user_cuisine_preference" enable row level security;

create table "public"."user_feedback" (
    "feedback_id" uuid not null default extensions.uuid_generate_v4(),
    "deal_id" uuid not null,
    "user_id" uuid not null,
    "reason_code_id" uuid not null,
    "reason_text" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."user_feedback" enable row level security;

create table "public"."user_report" (
    "report_id" uuid not null default extensions.uuid_generate_v4(),
    "deal_id" uuid not null,
    "reporter_user_id" uuid not null,
    "uploader_user_id" uuid,
    "resolved_by" uuid,
    "reason_code_id" uuid not null,
    "reason_text" text,
    "created_at" timestamp with time zone not null default now(),
    "status" status_enum not null,
    "resolution_action" resolution_action_enum
);


alter table "public"."user_report" enable row level security;

CREATE UNIQUE INDEX brand_name_key ON public.brand USING btree (name);

CREATE UNIQUE INDEX brand_pkey ON public.brand USING btree (brand_id);

CREATE UNIQUE INDEX category_category_name_key ON public.category USING btree (category_name);

CREATE UNIQUE INDEX category_pkey ON public.category USING btree (category_id);

CREATE UNIQUE INDEX cuisine_cuisine_name_key ON public.cuisine USING btree (cuisine_name);

CREATE UNIQUE INDEX cuisine_pkey ON public.cuisine USING btree (cuisine_id);

CREATE UNIQUE INDEX deal_instance_pkey ON public.deal_instance USING btree (deal_id);

CREATE UNIQUE INDEX deal_template_pkey ON public.deal_template USING btree (template_id);

CREATE UNIQUE INDEX favorite_pkey ON public.favorite USING btree (favorite_id);

CREATE INDEX idx_brand_name ON public.brand USING btree (name);

CREATE INDEX idx_category_name ON public.category USING btree (category_name);

CREATE INDEX idx_cuisine_name ON public.cuisine USING btree (cuisine_name);

CREATE INDEX idx_deal_feed_optimized ON public.deal_template USING btree (created_at DESC, restaurant_id, cuisine_id, category_id, is_anonymous);

CREATE INDEX idx_deal_instance_created_at ON public.deal_instance USING btree (created_at DESC);

CREATE INDEX idx_deal_instance_end_date ON public.deal_instance USING btree (end_date) WHERE (end_date IS NOT NULL);

CREATE INDEX idx_deal_instance_start_date ON public.deal_instance USING btree (start_date DESC);

CREATE INDEX idx_deal_instance_template_id ON public.deal_instance USING btree (template_id);

CREATE INDEX idx_deal_search ON public.deal_template USING btree (title, description, created_at DESC) WHERE (title IS NOT NULL);

CREATE INDEX idx_deal_template_category_id ON public.deal_template USING btree (category_id);

CREATE INDEX idx_deal_template_created_at ON public.deal_template USING btree (created_at DESC);

CREATE INDEX idx_deal_template_cuisine_id ON public.deal_template USING btree (cuisine_id);

CREATE INDEX idx_deal_template_feed_query ON public.deal_template USING btree (created_at DESC, restaurant_id, cuisine_id, category_id);

CREATE INDEX idx_deal_template_restaurant_id ON public.deal_template USING btree (restaurant_id);

CREATE INDEX idx_deal_template_user_id ON public.deal_template USING btree (user_id);

CREATE INDEX idx_favorite_created_at ON public.favorite USING btree (created_at DESC);

CREATE INDEX idx_favorite_deal_id ON public.favorite USING btree (deal_id);

CREATE INDEX idx_favorite_restaurant_id ON public.favorite USING btree (restaurant_id);

CREATE INDEX idx_favorite_user_id ON public.favorite USING btree (user_id);

CREATE INDEX idx_interaction_created_at ON public.interaction USING btree (created_at DESC);

CREATE INDEX idx_interaction_deal_id ON public.interaction USING btree (deal_id);

CREATE INDEX idx_interaction_session_id ON public.interaction USING btree (session_id);

CREATE INDEX idx_interaction_type ON public.interaction USING btree (interaction_type);

CREATE INDEX idx_interaction_user_created_at ON public.interaction USING btree (user_id, created_at DESC);

CREATE INDEX idx_interaction_user_id ON public.interaction USING btree (user_id);

CREATE INDEX idx_notification_sent_at ON public.notification USING btree (sent_at DESC);

CREATE INDEX idx_notification_user_id ON public.notification USING btree (user_id);

CREATE INDEX idx_notification_user_unread ON public.notification USING btree (user_id, is_read, sent_at DESC) WHERE (is_read = false);

CREATE INDEX idx_restaurant_brand_id ON public.restaurant USING btree (brand_id);

CREATE INDEX idx_restaurant_created_at ON public.restaurant USING btree (created_at DESC);

CREATE INDEX idx_restaurant_cuisine_cuisine_id ON public.restaurant_cuisine USING btree (cuisine_id);

CREATE INDEX idx_restaurant_cuisine_restaurant_id ON public.restaurant_cuisine USING btree (restaurant_id);

CREATE INDEX idx_restaurant_discovery ON public.restaurant USING btree (name, address, created_at DESC);

CREATE INDEX idx_restaurant_google_place_id ON public.restaurant USING btree (google_place_id) WHERE (google_place_id IS NOT NULL);

CREATE INDEX idx_restaurant_name ON public.restaurant USING btree (name);

CREATE INDEX idx_restaurant_source ON public.restaurant USING btree (source);

CREATE INDEX idx_session_start_time ON public.session USING btree (start_time DESC);

CREATE INDEX idx_session_user_id ON public.session USING btree (user_id);

CREATE INDEX idx_user_block_blocked_user_id ON public.user_block USING btree (blocked_user_id);

CREATE INDEX idx_user_block_blocker_user_id ON public.user_block USING btree (blocker_user_id);

CREATE INDEX idx_user_block_created_at ON public.user_block USING btree (created_at DESC);

CREATE INDEX idx_user_cuisine_preference_cuisine_id ON public.user_cuisine_preference USING btree (cuisine_id);

CREATE INDEX idx_user_cuisine_preference_user_id ON public.user_cuisine_preference USING btree (user_id);

CREATE INDEX idx_user_display_name ON public."user" USING btree (display_name);

CREATE INDEX idx_user_email ON public."user" USING btree (email);

CREATE INDEX idx_user_feedback_created_at ON public.user_feedback USING btree (created_at DESC);

CREATE INDEX idx_user_feedback_deal_id ON public.user_feedback USING btree (deal_id);

CREATE INDEX idx_user_feedback_user_id ON public.user_feedback USING btree (user_id);

CREATE INDEX idx_user_phone_number ON public."user" USING btree (phone_number) WHERE (phone_number IS NOT NULL);

CREATE INDEX idx_user_profile_queries ON public."user" USING btree (user_id, display_name, profile_photo, created_at);

CREATE INDEX idx_user_report_created_at ON public.user_report USING btree (created_at DESC);

CREATE INDEX idx_user_report_deal_id ON public.user_report USING btree (deal_id);

CREATE INDEX idx_user_report_reporter_user_id ON public.user_report USING btree (reporter_user_id);

CREATE INDEX idx_user_report_status ON public.user_report USING btree (status);

CREATE UNIQUE INDEX image_metadata_pkey ON public.image_metadata USING btree (image_metadata_id);

CREATE UNIQUE INDEX interaction_pkey ON public.interaction USING btree (interaction_id);

CREATE UNIQUE INDEX notification_pkey ON public.notification USING btree (notification_id);

CREATE UNIQUE INDEX reason_codes_pkey ON public.reason_code USING btree (reason_code_id);

CREATE UNIQUE INDEX restaurant_cuisine_pkey ON public.restaurant_cuisine USING btree (restaurant_id, cuisine_id);

CREATE UNIQUE INDEX restaurant_google_place_id_unique ON public.restaurant USING btree (google_place_id);

CREATE INDEX restaurant_location_idx ON public.restaurant USING gist (location);

CREATE UNIQUE INDEX restaurant_pkey ON public.restaurant USING btree (restaurant_id);

CREATE UNIQUE INDEX session_pkey ON public.session USING btree (session_id);

CREATE UNIQUE INDEX user_block_blocker_user_id_blocked_user_id_key ON public.user_block USING btree (blocker_user_id, blocked_user_id);

CREATE UNIQUE INDEX user_block_pkey ON public.user_block USING btree (block_id);

CREATE UNIQUE INDEX user_cuisine_preference_pkey ON public.user_cuisine_preference USING btree (user_id, cuisine_id);

CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);

CREATE UNIQUE INDEX user_feedback_pkey ON public.user_feedback USING btree (feedback_id);

CREATE INDEX user_location_idx ON public."user" USING gist (location);

CREATE UNIQUE INDEX user_name_key ON public."user" USING btree (display_name);

CREATE UNIQUE INDEX user_pkey ON public."user" USING btree (user_id);

CREATE UNIQUE INDEX user_report_pkey ON public.user_report USING btree (report_id);

alter table "public"."brand" add constraint "brand_pkey" PRIMARY KEY using index "brand_pkey";

alter table "public"."category" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

alter table "public"."cuisine" add constraint "cuisine_pkey" PRIMARY KEY using index "cuisine_pkey";

alter table "public"."deal_instance" add constraint "deal_instance_pkey" PRIMARY KEY using index "deal_instance_pkey";

alter table "public"."deal_template" add constraint "deal_template_pkey" PRIMARY KEY using index "deal_template_pkey";

alter table "public"."favorite" add constraint "favorite_pkey" PRIMARY KEY using index "favorite_pkey";

alter table "public"."image_metadata" add constraint "image_metadata_pkey" PRIMARY KEY using index "image_metadata_pkey";

alter table "public"."interaction" add constraint "interaction_pkey" PRIMARY KEY using index "interaction_pkey";

alter table "public"."notification" add constraint "notification_pkey" PRIMARY KEY using index "notification_pkey";

alter table "public"."reason_code" add constraint "reason_codes_pkey" PRIMARY KEY using index "reason_codes_pkey";

alter table "public"."restaurant" add constraint "restaurant_pkey" PRIMARY KEY using index "restaurant_pkey";

alter table "public"."restaurant_cuisine" add constraint "restaurant_cuisine_pkey" PRIMARY KEY using index "restaurant_cuisine_pkey";

alter table "public"."session" add constraint "session_pkey" PRIMARY KEY using index "session_pkey";

alter table "public"."user" add constraint "user_pkey" PRIMARY KEY using index "user_pkey";

alter table "public"."user_block" add constraint "user_block_pkey" PRIMARY KEY using index "user_block_pkey";

alter table "public"."user_cuisine_preference" add constraint "user_cuisine_preference_pkey" PRIMARY KEY using index "user_cuisine_preference_pkey";

alter table "public"."user_feedback" add constraint "user_feedback_pkey" PRIMARY KEY using index "user_feedback_pkey";

alter table "public"."user_report" add constraint "user_report_pkey" PRIMARY KEY using index "user_report_pkey";

alter table "public"."brand" add constraint "brand_logo_metadata_id_fkey" FOREIGN KEY (logo_metadata_id) REFERENCES image_metadata(image_metadata_id) not valid;

alter table "public"."brand" validate constraint "brand_logo_metadata_id_fkey";

alter table "public"."brand" add constraint "brand_name_key" UNIQUE using index "brand_name_key";

alter table "public"."category" add constraint "category_category_name_key" UNIQUE using index "category_category_name_key";

alter table "public"."cuisine" add constraint "cuisine_cuisine_name_key" UNIQUE using index "cuisine_cuisine_name_key";

alter table "public"."deal_instance" add constraint "deal_instance_template_id_fkey" FOREIGN KEY (template_id) REFERENCES deal_template(template_id) ON DELETE CASCADE not valid;

alter table "public"."deal_instance" validate constraint "deal_instance_template_id_fkey";

alter table "public"."deal_template" add constraint "deal_template_category_id_fkey" FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE RESTRICT not valid;

alter table "public"."deal_template" validate constraint "deal_template_category_id_fkey";

alter table "public"."deal_template" add constraint "deal_template_cuisine_id_fkey" FOREIGN KEY (cuisine_id) REFERENCES cuisine(cuisine_id) ON DELETE SET NULL not valid;

alter table "public"."deal_template" validate constraint "deal_template_cuisine_id_fkey";

alter table "public"."deal_template" add constraint "deal_template_image_metadata_id_fkey" FOREIGN KEY (image_metadata_id) REFERENCES image_metadata(image_metadata_id) not valid;

alter table "public"."deal_template" validate constraint "deal_template_image_metadata_id_fkey";

alter table "public"."deal_template" add constraint "deal_template_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."deal_template" validate constraint "deal_template_restaurant_id_fkey";

alter table "public"."deal_template" add constraint "deal_template_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE SET NULL not valid;

alter table "public"."deal_template" validate constraint "deal_template_user_id_fkey";

alter table "public"."favorite" add constraint "favorite_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES deal_instance(deal_id) ON DELETE CASCADE not valid;

alter table "public"."favorite" validate constraint "favorite_deal_id_fkey";

alter table "public"."favorite" add constraint "favorite_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."favorite" validate constraint "favorite_restaurant_id_fkey";

alter table "public"."favorite" add constraint "favorite_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."favorite" validate constraint "favorite_user_id_fkey";

alter table "public"."image_metadata" add constraint "image_metadata_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE SET NULL not valid;

alter table "public"."image_metadata" validate constraint "image_metadata_user_id_fkey";

alter table "public"."interaction" add constraint "interaction_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES deal_instance(deal_id) ON DELETE SET NULL not valid;

alter table "public"."interaction" validate constraint "interaction_deal_id_fkey";

alter table "public"."interaction" add constraint "interaction_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON UPDATE CASCADE not valid;

alter table "public"."interaction" validate constraint "interaction_restaurant_id_fkey";

alter table "public"."interaction" add constraint "interaction_session_id_fkey" FOREIGN KEY (session_id) REFERENCES session(session_id) ON DELETE SET NULL not valid;

alter table "public"."interaction" validate constraint "interaction_session_id_fkey";

alter table "public"."interaction" add constraint "interaction_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."interaction" validate constraint "interaction_user_id_fkey";

alter table "public"."notification" add constraint "notification_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES deal_instance(deal_id) ON DELETE CASCADE not valid;

alter table "public"."notification" validate constraint "notification_deal_id_fkey";

alter table "public"."notification" add constraint "notification_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."notification" validate constraint "notification_user_id_fkey";

alter table "public"."restaurant" add constraint "restaurant_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brand(brand_id) ON DELETE SET NULL not valid;

alter table "public"."restaurant" validate constraint "restaurant_brand_id_fkey";

alter table "public"."restaurant" add constraint "restaurant_google_place_id_unique" UNIQUE using index "restaurant_google_place_id_unique";

alter table "public"."restaurant" add constraint "restaurant_restaurant_image_metadata_fkey" FOREIGN KEY (restaurant_image_metadata) REFERENCES image_metadata(image_metadata_id) ON UPDATE CASCADE not valid;

alter table "public"."restaurant" validate constraint "restaurant_restaurant_image_metadata_fkey";

alter table "public"."restaurant_cuisine" add constraint "restaurant_cuisine_cuisine_id_fkey" FOREIGN KEY (cuisine_id) REFERENCES cuisine(cuisine_id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_cuisine" validate constraint "restaurant_cuisine_cuisine_id_fkey";

alter table "public"."restaurant_cuisine" add constraint "restaurant_cuisine_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE not valid;

alter table "public"."restaurant_cuisine" validate constraint "restaurant_cuisine_restaurant_id_fkey";

alter table "public"."session" add constraint "session_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."session" validate constraint "session_user_id_fkey";

alter table "public"."user" add constraint "user_email_key" UNIQUE using index "user_email_key";

alter table "public"."user" add constraint "user_name_key" UNIQUE using index "user_name_key";

alter table "public"."user" add constraint "user_profile_photo_metadata_id_fkey" FOREIGN KEY (profile_photo_metadata_id) REFERENCES image_metadata(image_metadata_id) not valid;

alter table "public"."user" validate constraint "user_profile_photo_metadata_id_fkey";

alter table "public"."user" add constraint "user_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user" validate constraint "user_user_id_fkey";

alter table "public"."user_block" add constraint "user_block_blocked_user_id_fkey" FOREIGN KEY (blocked_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."user_block" validate constraint "user_block_blocked_user_id_fkey";

alter table "public"."user_block" add constraint "user_block_blocker_user_id_blocked_user_id_key" UNIQUE using index "user_block_blocker_user_id_blocked_user_id_key";

alter table "public"."user_block" add constraint "user_block_blocker_user_id_fkey" FOREIGN KEY (blocker_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."user_block" validate constraint "user_block_blocker_user_id_fkey";

alter table "public"."user_block" add constraint "user_block_reason_code_id_fkey" FOREIGN KEY (reason_code_id) REFERENCES reason_code(reason_code_id) ON DELETE RESTRICT not valid;

alter table "public"."user_block" validate constraint "user_block_reason_code_id_fkey";

alter table "public"."user_cuisine_preference" add constraint "user_cuisine_preference_cuisine_id_fkey" FOREIGN KEY (cuisine_id) REFERENCES cuisine(cuisine_id) ON DELETE CASCADE not valid;

alter table "public"."user_cuisine_preference" validate constraint "user_cuisine_preference_cuisine_id_fkey";

alter table "public"."user_cuisine_preference" add constraint "user_cuisine_preference_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."user_cuisine_preference" validate constraint "user_cuisine_preference_user_id_fkey";

alter table "public"."user_feedback" add constraint "user_feedback_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES deal_instance(deal_id) ON DELETE CASCADE not valid;

alter table "public"."user_feedback" validate constraint "user_feedback_deal_id_fkey";

alter table "public"."user_feedback" add constraint "user_feedback_reason_code_id_fkey" FOREIGN KEY (reason_code_id) REFERENCES reason_code(reason_code_id) ON DELETE RESTRICT not valid;

alter table "public"."user_feedback" validate constraint "user_feedback_reason_code_id_fkey";

alter table "public"."user_feedback" add constraint "user_feedback_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."user_feedback" validate constraint "user_feedback_user_id_fkey";

alter table "public"."user_report" add constraint "user_report_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES deal_instance(deal_id) ON DELETE CASCADE not valid;

alter table "public"."user_report" validate constraint "user_report_deal_id_fkey";

alter table "public"."user_report" add constraint "user_report_reason_code_id_fkey" FOREIGN KEY (reason_code_id) REFERENCES reason_code(reason_code_id) ON DELETE RESTRICT not valid;

alter table "public"."user_report" validate constraint "user_report_reason_code_id_fkey";

alter table "public"."user_report" add constraint "user_report_reporter_user_id_fkey" FOREIGN KEY (reporter_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE not valid;

alter table "public"."user_report" validate constraint "user_report_reporter_user_id_fkey";

alter table "public"."user_report" add constraint "user_report_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES "user"(user_id) ON DELETE SET NULL not valid;

alter table "public"."user_report" validate constraint "user_report_resolved_by_fkey";

alter table "public"."user_report" add constraint "user_report_uploader_user_id_fkey" FOREIGN KEY (uploader_user_id) REFERENCES "user"(user_id) ON DELETE SET NULL not valid;

alter table "public"."user_report" validate constraint "user_report_uploader_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_deal_instance_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    -- Insert a deal_instance (without restaurant_id since it's not in the table)
    INSERT INTO deal_instance (template_id, start_date, end_date, is_anonymous)
    VALUES (NEW.template_id, NOW(), NULL, NEW.is_anonymous);
    
    RETURN NEW;
END;$function$
;

create or replace view "public"."deal_feed_view" as  SELECT template_id AS deal_id,
    title,
    description,
    image_url,
    image_metadata_id
   FROM deal_template dt;


DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geometry_dump') THEN
        CREATE TYPE "public"."geometry_dump" AS ("path" integer[], "geom" geometry);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_blocked_user_ids(p_user_id uuid)
 RETURNS TABLE(user_id uuid)
 LANGUAGE plpgsql
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_deal_report_counts(deal_ids uuid[])
 RETURNS TABLE(deal_id uuid, report_count bigint)
 LANGUAGE plpgsql
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_restaurant(p_google_place_id text, p_name text, p_address text, p_lat double precision, p_lng double precision)
 RETURNS uuid
 LANGUAGE plpgsql
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
  -- Clean the input name for better matching
  v_clean_name := LOWER(TRIM(p_name));
  
  -- 1. Check if restaurant exists by google_place_id (primary check)
  IF p_google_place_id IS NOT NULL THEN
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.restaurant
    WHERE google_place_id = p_google_place_id
    LIMIT 1;
    
    IF v_restaurant_id IS NOT NULL THEN
      RAISE NOTICE 'Restaurant found by google_place_id: %', v_restaurant_id;
      RETURN v_restaurant_id;
    END IF;
  END IF;
  
  -- 2. Enhanced brand matching with multiple strategies
  -- Strategy 1: Exact match (highest priority)
  SELECT brand_id, name INTO v_brand_id, v_brand_name
  FROM public.brand
  WHERE LOWER(TRIM(name)) = v_clean_name
  LIMIT 1;
  
  IF v_brand_id IS NOT NULL THEN
    RAISE NOTICE 'Exact brand match found: % (%)', v_brand_name, v_brand_id;
  ELSE
    -- Strategy 2: Restaurant name contains brand name
    FOR v_brand_id, v_brand_name IN
      SELECT brand_id, name
      FROM public.brand
      WHERE LENGTH(TRIM(name)) >= 3  -- Avoid false positives
        AND v_clean_name LIKE '%' || LOWER(TRIM(name)) || '%'
      ORDER BY LENGTH(name) DESC  -- Prefer longer, more specific matches
    LOOP
      v_match_score := LENGTH(v_brand_name);
      IF v_match_score > v_best_match_score THEN
        v_best_match_score := v_match_score;
        v_best_brand_id := v_brand_id;
      END IF;
    END LOOP;
    
    -- Strategy 3: Brand name contains restaurant name (for cases like "McDonald's" -> "McDonald's Restaurant")
    IF v_best_brand_id IS NULL THEN
      FOR v_brand_id, v_brand_name IN
        SELECT brand_id, name
        FROM public.brand
        WHERE LENGTH(TRIM(name)) >= 3
          AND LOWER(TRIM(name)) LIKE '%' || v_clean_name || '%'
        ORDER BY LENGTH(name) ASC  -- Prefer shorter matches (more specific)
      LOOP
        v_match_score := LENGTH(v_clean_name);
        IF v_match_score > v_best_match_score THEN
          v_best_match_score := v_match_score;
          v_best_brand_id := v_brand_id;
        END IF;
      END LOOP;
    END IF;
    
    -- Use the best match found
    IF v_best_brand_id IS NOT NULL THEN
      v_brand_id := v_best_brand_id;
      RAISE NOTICE 'Best brand match found: % (score: %)', v_brand_name, v_best_match_score;
    ELSE
      RAISE NOTICE 'No brand match found for: %', p_name;
    END IF;
  END IF;
  
  -- 3. Create PostGIS point from lat/lng (SRID 4326 is WGS84)
  v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);
  
  -- 4. Insert new restaurant with brand_id (if found) and google_place_id
  INSERT INTO public.restaurant (
    name,
    address,
    location,
    brand_id,
    google_place_id,
    source
  ) VALUES (
    p_name,
    p_address,
    v_location,
    v_brand_id,  -- Will be NULL if no brand match
    p_google_place_id,
    'google_places'
  )
  RETURNING restaurant_id INTO v_restaurant_id;
  
  RAISE NOTICE 'New restaurant created: % with brand_id: %', v_restaurant_id, v_brand_id;
  RETURN v_restaurant_id;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Handle race condition: another process created the restaurant
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.restaurant
    WHERE google_place_id = p_google_place_id
    LIMIT 1;
    RETURN v_restaurant_id;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_or_create_restaurant: %', SQLERRM;
    RAISE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_restaurants_with_deal_counts(user_lat double precision, user_lng double precision)
 RETURNS TABLE(restaurant_id uuid, name character varying, address character varying, restaurant_image_metadata uuid, deal_count bigint, distance_miles numeric, lat double precision, lng double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH restaurant_deal_counts AS (
    SELECT 
      dt.restaurant_id,
      COUNT(di.deal_id) as deal_count
    FROM deal_instance di
    INNER JOIN deal_template dt ON di.template_id = dt.template_id
    WHERE dt.restaurant_id IS NOT NULL
    GROUP BY dt.restaurant_id
  ),
  restaurant_locations AS (
    SELECT 
      r.restaurant_id,
      r.name,
      r.address,
      r.restaurant_image_metadata,  -- Changed
      ST_X(r.location::geometry) as lng,
      ST_Y(r.location::geometry) as lat
    FROM restaurant r
    WHERE r.location IS NOT NULL
  )
  SELECT 
    rl.restaurant_id,
    rl.name,
    rl.address,
    rl.restaurant_image_metadata,  -- Changed
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_cuisine_preferences(p_user_id uuid)
 RETURNS TABLE(cuisine_id uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.cuisine_id
  FROM
    public.user_cuisine_preference AS t -- Updated to match your table name
  WHERE
    t.user_id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_location_coords(user_uuid uuid)
 RETURNS TABLE(lat double precision, lng double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ST_Y(u.location::geometry) as lat,
    ST_X(u.location::geometry) as lng
  FROM "user" u
  WHERE u.user_id = user_uuid
  AND u.location IS NOT NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user (
    user_id,
    display_name,
    email,
    phone_number,
    first_name,
    last_name,
    profile_photo,
    location_city,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substring(NEW.id::text from 1 for 8)
    ),
    NEW.email,
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone_number', ''), ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'profile_photo_url', 'default_avatar.png'),
    COALESCE(NEW.raw_user_meta_data->'location_data'->>'city', ''),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User creation failed: Duplicate user data (email, phone, or username already exists)';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'User creation failed: %', SQLERRM;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.nearby_deals(lat double precision, long double precision, radius_miles double precision)
 RETURNS TABLE(deal_id uuid, template_id uuid, created_at timestamp with time zone, is_anonymous boolean, start_date timestamp with time zone, end_date timestamp with time zone, distance_miles double precision, view_count bigint, deal_template json)
 LANGUAGE plpgsql
AS $function$
DECLARE
    radius_meters float;
    user_location geography;
BEGIN
    -- Convert miles to meters for PostGIS and create user location
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
        -- Calculate distance in miles
        (ST_Distance(r.location, user_location) / 1609.34)::float AS distance_miles,
        -- Count clicks and return as view_count, defaulting to 0
        COALESCE(deal_clicks.click_count, 0) AS view_count,
        -- Aggregate deal_template data into a JSON object
        json_build_object(
            'template_id', dt.template_id,
            'user_id', dt.user_id,
            'cuisine_id', dt.cuisine_id,
            'restaurant_id', dt.restaurant_id,
            'title', dt.title,
            'description', dt.description
            -- Add other template fields as needed
        ) AS deal_template
    FROM
        public.restaurant AS r
    JOIN
        public.deal_template AS dt ON r.restaurant_id = dt.restaurant_id
    JOIN
        public.deal_instance AS d ON dt.template_id = d.template_id
    -- This LEFT JOIN is where the view counting happens
    LEFT JOIN (
        SELECT
            i.deal_id,
            -- Count interactions where the type is 'click-open'
            COUNT(*) AS click_count
        FROM
            public.interaction AS i
        WHERE
            i.interaction_type = 'click-open' -- This is what we count as a "view"
        GROUP BY
            i.deal_id
    ) AS deal_clicks ON d.deal_id = deal_clicks.deal_id
    WHERE
        -- Find restaurants within the specified radius
        ST_DWithin(
            r.location,
            user_location,
            radius_meters
        )
        AND d.start_date <= now()
        AND (d.end_date IS NULL OR d.end_date >= now());
END;
$function$
;

create or replace view "public"."restaurants_with_coords" as  SELECT restaurant_id,
    name,
    address,
    restaurant_image_metadata,
    brand_id,
    created_at,
    st_y((location)::geometry) AS lat,
    st_x((location)::geometry) AS lng
   FROM restaurant
  WHERE (location IS NOT NULL);


CREATE OR REPLACE FUNCTION public.update_restaurant_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_location(user_uuid uuid, lat numeric, lng numeric, city text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.user 
  SET 
    location = ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
    location_city = COALESCE(city, location_city)
  WHERE user_id = user_uuid;
END;
$function$
;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'valid_detail') THEN
        CREATE TYPE "public"."valid_detail" AS ("valid" boolean, "reason" character varying, "location" geometry);
    END IF;
END $$;

create policy "Users can create instances for own deals"
on "public"."deal_instance"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM deal_template
  WHERE ((deal_template.template_id = deal_instance.template_id) AND (deal_template.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can view all deal instances"
on "public"."deal_instance"
as permissive
for select
to public
using (true);


create policy "Users can create own deals"
on "public"."deal_template"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can delete own deals"
on "public"."deal_template"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can update own deals"
on "public"."deal_template"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view all deal templates"
on "public"."deal_template"
as permissive
for select
to public
using (true);


create policy "Users can add their own favorites"
on "public"."favorite"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can delete own favorites"
on "public"."favorite"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can view their own favorites"
on "public"."favorite"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can create own interactions"
on "public"."interaction"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can delete own interactions"
on "public"."interaction"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can update own interactions"
on "public"."interaction"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view all interactions"
on "public"."interaction"
as permissive
for select
to public
using (true);


create policy "Users can create own notifications"
on "public"."notification"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can update own notifications"
on "public"."notification"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view own notifications"
on "public"."notification"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can create own sessions"
on "public"."session"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can update own sessions"
on "public"."session"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view own sessions"
on "public"."session"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can insert own profile"
on "public"."user"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can update own profile"
on "public"."user"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view profiles"
on "public"."user"
as permissive
for select
to public
using (((user_id = auth.uid()) OR true));


create policy "Users can delete their own blocks"
on "public"."user_block"
as permissive
for delete
to public
using ((blocker_user_id = auth.uid()));


create policy "Users can insert their own blocks"
on "public"."user_block"
as permissive
for insert
to public
with check ((blocker_user_id = auth.uid()));


create policy "Users can view their own block list"
on "public"."user_block"
as permissive
for select
to public
using ((auth.uid() = blocker_user_id));


create policy "Users can create own preferences"
on "public"."user_cuisine_preference"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can delete own preferences"
on "public"."user_cuisine_preference"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can update own preferences"
on "public"."user_cuisine_preference"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view own preferences"
on "public"."user_cuisine_preference"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can view their own cuisine preferences"
on "public"."user_cuisine_preference"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create own feedback"
on "public"."user_feedback"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can delete own feedback"
on "public"."user_feedback"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can update own feedback"
on "public"."user_feedback"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view own feedback"
on "public"."user_feedback"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can create reports as reporter"
on "public"."user_report"
as permissive
for insert
to public
with check ((reporter_user_id = auth.uid()));


create policy "Users can update their own reports"
on "public"."user_report"
as permissive
for update
to public
using ((reporter_user_id = auth.uid()));


create policy "Users can view their own reports"
on "public"."user_report"
as permissive
for select
to public
using (((reporter_user_id = auth.uid()) OR (uploader_user_id = auth.uid())));


CREATE TRIGGER trigger_create_deal_instance AFTER INSERT ON public.deal_template FOR EACH ROW EXECUTE FUNCTION create_deal_instance_trigger();

CREATE TRIGGER trigger_update_restaurant_updated_at BEFORE UPDATE ON public.restaurant FOR EACH ROW EXECUTE FUNCTION update_restaurant_updated_at();


