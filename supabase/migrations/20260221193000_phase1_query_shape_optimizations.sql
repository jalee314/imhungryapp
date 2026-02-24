-- Phase 1: Query-shape optimization indexes + RPC aggregations

-- ------------------------------------------------------------
-- Hot predicate indexes
-- ------------------------------------------------------------

create index if not exists idx_interaction_deal_type_created_at_desc
  on public.interaction (deal_id, interaction_type, created_at desc);

create index if not exists idx_interaction_user_deal_type_created_at_desc
  on public.interaction (user_id, deal_id, interaction_type, created_at desc);

create index if not exists idx_favorite_user_deal
  on public.favorite (user_id, deal_id);

create index if not exists idx_favorite_user_restaurant_null_deal
  on public.favorite (user_id, restaurant_id)
  where deal_id is null;

create index if not exists idx_deal_template_restaurant_created_at_desc
  on public.deal_template (restaurant_id, created_at desc);

create index if not exists idx_user_report_deal_reporter_status
  on public.user_report (deal_id, reporter_user_id, status);

-- ------------------------------------------------------------
-- Vote aggregation RPCs
-- ------------------------------------------------------------

create or replace function public.get_latest_vote_states_for_deals(
  p_user_id uuid,
  p_deal_ids uuid[]
)
returns table (
  deal_id uuid,
  latest_vote text,
  is_favorited boolean
)
language sql
stable
as $$
  with requested_deals as (
    select distinct unnest(p_deal_ids) as deal_id
  ),
  latest_votes as (
    select distinct on (i.deal_id)
      i.deal_id,
      i.interaction_type as latest_vote
    from public.interaction i
    where i.user_id = p_user_id
      and i.deal_id = any(p_deal_ids)
      and i.interaction_type in ('upvote', 'downvote')
    order by i.deal_id, i.created_at desc, i.interaction_id desc
  )
  select
    rd.deal_id,
    lv.latest_vote::text as latest_vote,
    exists (
      select 1
      from public.favorite f
      where f.user_id = p_user_id
        and f.deal_id = rd.deal_id
    ) as is_favorited
  from requested_deals rd
  left join latest_votes lv
    on lv.deal_id = rd.deal_id;
$$;

create or replace function public.get_net_vote_counts_for_deals(
  p_deal_ids uuid[]
)
returns table (
  deal_id uuid,
  net_votes integer
)
language sql
stable
as $$
  with requested_deals as (
    select distinct unnest(p_deal_ids) as deal_id
  ),
  latest_user_votes as (
    select distinct on (i.deal_id, i.user_id)
      i.deal_id,
      i.user_id,
      i.interaction_type
    from public.interaction i
    where i.deal_id = any(p_deal_ids)
      and i.interaction_type in ('upvote', 'downvote')
    order by i.deal_id, i.user_id, i.created_at desc, i.interaction_id desc
  ),
  aggregated as (
    select
      luv.deal_id,
      coalesce(sum(
        case
          when luv.interaction_type = 'upvote' then 1
          when luv.interaction_type = 'downvote' then -1
          else 0
        end
      ), 0)::integer as net_votes
    from latest_user_votes luv
    group by luv.deal_id
  )
  select
    rd.deal_id,
    coalesce(a.net_votes, 0)::integer as net_votes
  from requested_deals rd
  left join aggregated a
    on a.deal_id = rd.deal_id;
$$;

create or replace function public.get_upvote_counts_for_deals(
  p_deal_ids uuid[]
)
returns table (
  deal_id uuid,
  upvote_count integer
)
language sql
stable
as $$
  select
    i.deal_id,
    count(*)::integer as upvote_count
  from public.interaction i
  where i.deal_id = any(p_deal_ids)
    and i.interaction_type = 'upvote'
  group by i.deal_id;
$$;

grant execute on function public.get_latest_vote_states_for_deals(uuid, uuid[])
  to anon, authenticated, service_role;

grant execute on function public.get_net_vote_counts_for_deals(uuid[])
  to anon, authenticated, service_role;

grant execute on function public.get_upvote_counts_for_deals(uuid[])
  to anon, authenticated, service_role;
