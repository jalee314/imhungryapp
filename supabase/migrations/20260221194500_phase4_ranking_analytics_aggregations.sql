-- Phase 4: Ranking + analytics aggregation pipeline
-- Moves expensive row-level aggregation work from edge/app JS into SQL RPCs.

-- ------------------------------------------------------------
-- Ranking quality input aggregation
-- ------------------------------------------------------------

create or replace function public.get_deal_quality_components(
  p_deal_ids uuid[]
)
returns table (
  deal_id uuid,
  weighted_positives double precision,
  weighted_negatives_abs double precision
)
language sql
stable
as $$
  with requested_deals as (
    select distinct unnest(p_deal_ids) as deal_id
  ),
  weighted_interactions as (
    select
      i.deal_id,
      (
        case i.interaction_type::text
          when 'save' then 3.0
          when 'share' then 3.0
          when 'click-through' then 2.5
          when 'click-open' then 1.5
          when 'upvote' then 1.0
          when 'downvote' then -2.0
          when 'report' then -3.0
          else 0.0
        end
      ) *
      (
        case
          when i.created_at > now() then 1.0
          else power(
            0.5::double precision,
            (
              extract(epoch from (now() - i.created_at))
              / 86400.0
            ) / 15.0
          )
        end
      ) as decayed_weight
    from public.interaction i
    where i.deal_id = any(p_deal_ids)
  ),
  aggregated as (
    select
      wi.deal_id,
      coalesce(
        sum(
          case
            when wi.decayed_weight > 0 then wi.decayed_weight
            else 0
          end
        ),
        0
      )::double precision as weighted_positives,
      coalesce(
        sum(
          case
            when wi.decayed_weight < 0 then abs(wi.decayed_weight)
            else 0
          end
        ),
        0
      )::double precision as weighted_negatives_abs
    from weighted_interactions wi
    group by wi.deal_id
  )
  select
    rd.deal_id,
    coalesce(a.weighted_positives, 0)::double precision as weighted_positives,
    coalesce(a.weighted_negatives_abs, 0)::double precision as weighted_negatives_abs
  from requested_deals rd
  left join aggregated a
    on a.deal_id = rd.deal_id;
$$;

grant execute on function public.get_deal_quality_components(uuid[])
  to authenticated, service_role;

-- ------------------------------------------------------------
-- Admin dashboard analytics aggregation
-- ------------------------------------------------------------

create or replace function public.get_admin_dashboard_analytics(
  p_days integer default 7,
  p_top_users integer default 3,
  p_top_deals integer default 10
)
returns jsonb
language sql
stable
as $$
  with params as (
    select
      greatest(coalesce(p_days, 7), 1) as days_window,
      greatest(coalesce(p_top_users, 3), 1) as top_users,
      greatest(coalesce(p_top_deals, 10), 1) as top_deals
  ),
  cutoff as (
    select now() - make_interval(days => p.days_window) as since_ts
    from params p
  ),
  totals as (
    select
      (select count(*)::integer from public."user") as total_users,
      (select count(*)::integer from public.deal_instance) as total_deals,
      (select count(*)::integer from public.user_report) as total_reports,
      (
        select count(*)::integer
        from public.user_report ur
        where ur.status = 'pending'::public.status_enum
      ) as pending_reports,
      (
        select count(*)::integer
        from public."user" u, cutoff c
        where u.created_at >= c.since_ts
      ) as recent_signups,
      (
        select count(*)::integer
        from public.deal_instance d, cutoff c
        where d.created_at >= c.since_ts
      ) as deals_this_week
  ),
  active_users as (
    select coalesce(
      jsonb_agg(to_jsonb(rows) order by rows.deal_count desc),
      '[]'::jsonb
    ) as items
    from (
      select
        s.user_id,
        coalesce(u.display_name, 'Unknown') as display_name,
        count(*)::integer as deal_count
      from public.session s
      left join public."user" u
        on u.user_id = s.user_id
      where s.user_id is not null
      group by s.user_id, u.display_name
      order by count(*) desc
      limit (select top_users from params)
    ) rows
  ),
  popular_deals as (
    select coalesce(
      jsonb_agg(to_jsonb(rows) order by rows.interaction_count desc),
      '[]'::jsonb
    ) as items
    from (
      select
        i.deal_id as deal_instance_id,
        coalesce(dt.title, 'Unknown') as title,
        count(*)::integer as interaction_count
      from public.interaction i
      left join public.deal_instance di
        on di.deal_id = i.deal_id
      left join public.deal_template dt
        on dt.template_id = di.template_id
      where i.deal_id is not null
      group by i.deal_id, dt.title
      order by count(*) desc
      limit (select top_deals from params)
    ) rows
  )
  select jsonb_build_object(
    'totalUsers', t.total_users,
    'totalDeals', t.total_deals,
    'totalReports', t.total_reports,
    'pendingReports', t.pending_reports,
    'mostActiveUsers', au.items,
    'mostPopularDeals', pd.items,
    'recentSignups', t.recent_signups,
    'dealsThisWeek', t.deals_this_week
  )
  from totals t
  cross join active_users au
  cross join popular_deals pd;
$$;

grant execute on function public.get_admin_dashboard_analytics(integer, integer, integer)
  to authenticated, service_role;
