-- Repeat visits are intentionally separate from check_ins. check_ins remains
-- the one-row-per-stairway lifetime "Spotted" / verification summary used by
-- badges and the main leaderboard; this table is an append-only history of
-- on-site photo verifications, limited to one per SF calendar day.
create table if not exists public.verified_visits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stairway_id uuid not null references public.stairways(id) on delete cascade,
  visited_at timestamptz not null default now(),
  visit_date date not null default ((timezone('America/Los_Angeles', now()))::date),
  mayorship_eligible boolean not null default false,
  created_at timestamptz not null default now(),
  constraint verified_visits_one_per_sf_day
    unique (user_id, stairway_id, visit_date)
);

create index if not exists verified_visits_stairway_window_idx
  on public.verified_visits (stairway_id, visited_at desc);

create index if not exists verified_visits_user_history_idx
  on public.verified_visits (user_id, stairway_id, visited_at desc);

alter table public.verified_visits enable row level security;

drop policy if exists "Users can view their own verified visits"
  on public.verified_visits;
create policy "Users can view their own verified visits"
on public.verified_visits
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Raw visit times are never public. This small table remembers only the
-- incumbent so an exact tie can keep the existing mayor.
create table if not exists public.stairway_mayors (
  stairway_id uuid primary key references public.stairways(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  crowned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stairway_mayors enable row level security;

-- Internal helper. It recalculates the active 30-day standings, keeps the
-- incumbent on a tie, and returns only the public display name and aggregate.
create or replace function public.refresh_stairway_mayor(
  p_stairway_id uuid
)
returns table (
  mayor_user_id uuid,
  mayor_display_name text,
  mayor_visit_count bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  incumbent_user_id uuid;
  winning_user_id uuid;
  winning_display_name text;
  winning_visit_count bigint;
begin
  select mayors.user_id
    into incumbent_user_id
  from public.stairway_mayors as mayors
  where mayors.stairway_id = p_stairway_id;

  with visit_counts as (
    select
      visits.user_id,
      settings.display_name,
      count(*)::bigint as visit_count,
      min(visits.visited_at) as first_active_visit
    from public.verified_visits as visits
    join public.user_settings as settings
      on settings.user_id = visits.user_id
    where visits.stairway_id = p_stairway_id
      and visits.visited_at >= now() - interval '30 days'
      and visits.mayorship_eligible is true
      and settings.leaderboard_opt_in is true
      and nullif(trim(settings.display_name), '') is not null
    group by visits.user_id, settings.display_name
    -- One verified visit is a visit, not a mayorship. Requiring two visits
    -- on different SF calendar days prevents an empty stairway from handing
    -- out a crown immediately.
    having count(*) >= 2
  )
  select
    counts.user_id,
    counts.display_name,
    counts.visit_count
    into winning_user_id, winning_display_name, winning_visit_count
  from visit_counts as counts
  order by
    counts.visit_count desc,
    case when counts.user_id = incumbent_user_id then 0 else 1 end,
    counts.first_active_visit asc,
    counts.user_id asc
  limit 1;

  if winning_user_id is null then
    delete from public.stairway_mayors
    where stairway_id = p_stairway_id;
    return;
  end if;

  insert into public.stairway_mayors (
    stairway_id,
    user_id,
    crowned_at,
    updated_at
  ) values (
    p_stairway_id,
    winning_user_id,
    now(),
    now()
  )
  on conflict (stairway_id) do update
  set
    user_id = excluded.user_id,
    crowned_at = case
      when public.stairway_mayors.user_id = excluded.user_id
        then public.stairway_mayors.crowned_at
      else now()
    end,
    updated_at = now();

  return query
  select winning_user_id, winning_display_name, winning_visit_count;
end;
$$;

-- Opting out is a deliberate forfeiture of every current mayorship. Earlier
-- qualifying visits remain in private history, but can never spring back into
-- the mayorship race if the user later rejoins the leaderboard. Their lifetime
-- check_ins rows are untouched, so their regular leaderboard total returns.
create or replace function public.reset_mayorships_on_leaderboard_opt_out()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  affected_stairway_id uuid;
begin
  for affected_stairway_id in
    select distinct visits.stairway_id
    from public.verified_visits as visits
    where visits.user_id = new.user_id
      and visits.mayorship_eligible is true
  loop
    update public.verified_visits
    set mayorship_eligible = false
    where user_id = new.user_id
      and stairway_id = affected_stairway_id
      and mayorship_eligible is true;

    perform *
    from public.refresh_stairway_mayor(affected_stairway_id);
  end loop;

  return new;
end;
$$;

drop trigger if exists reset_mayorships_after_leaderboard_opt_out
  on public.user_settings;
create trigger reset_mayorships_after_leaderboard_opt_out
after update of leaderboard_opt_in on public.user_settings
for each row
when (
  old.leaderboard_opt_in is true
  and new.leaderboard_opt_in is false
)
execute function public.reset_mayorships_on_leaderboard_opt_out();

-- Private history for the signed-in user only.
create or replace function public.get_my_verified_visit_history(
  p_stairway_id uuid
)
returns table (
  visited_at timestamptz,
  visit_date date
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select visits.visited_at, visits.visit_date
  from public.verified_visits as visits
  where visits.user_id = auth.uid()
    and visits.stairway_id = p_stairway_id
  order by visits.visited_at desc;
$$;

create or replace function public.get_stairway_visit_summary(
  p_stairway_id uuid
)
returns table (
  total_visits bigint,
  rolling_visits bigint,
  visited_today boolean,
  is_mayor boolean,
  mayor_user_id uuid,
  mayor_display_name text,
  mayor_visit_count bigint,
  my_mayorship_visit_count bigint,
  visits_needed bigint,
  deadline date,
  eligible boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  sf_today date := (timezone('America/Los_Angeles', now()))::date;
  current_total bigint := 0;
  current_rolling bigint := 0;
  current_mayorship_count bigint := 0;
  did_visit_today boolean := false;
  current_is_eligible boolean := false;
  current_is_mayor boolean := false;
  current_mayor_user_id uuid;
  current_mayor_name text;
  current_mayor_count bigint := 0;
  current_visits_needed bigint;
  current_deadline date;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select
    count(*)::bigint,
    count(*) filter (
      where visits.visited_at >= now() - interval '30 days'
    )::bigint,
    coalesce(bool_or(visits.visit_date = sf_today), false)
    into current_total, current_rolling, did_visit_today
  from public.verified_visits as visits
  where visits.user_id = current_user_id
    and visits.stairway_id = p_stairway_id;

  select
    coalesce(settings.leaderboard_opt_in, false)
      and nullif(trim(settings.display_name), '') is not null
    into current_is_eligible
  from public.user_settings as settings
  where settings.user_id = current_user_id;

  current_is_eligible := coalesce(current_is_eligible, false);

  select count(*)::bigint
    into current_mayorship_count
  from public.verified_visits as visits
  where visits.user_id = current_user_id
    and visits.stairway_id = p_stairway_id
    and visits.visited_at >= now() - interval '30 days'
    and visits.mayorship_eligible is true;

  select refreshed.mayor_user_id,
         refreshed.mayor_display_name,
         refreshed.mayor_visit_count
    into current_mayor_user_id, current_mayor_name, current_mayor_count
  from public.refresh_stairway_mayor(p_stairway_id) as refreshed;

  current_mayor_count := coalesce(current_mayor_count, 0);
  current_is_mayor := coalesce(current_mayor_user_id = current_user_id, false);

  if current_is_eligible and not current_is_mayor then
    current_visits_needed := case
      when current_mayor_count >= 2 then greatest(
        current_mayor_count - current_mayorship_count + 1,
        1
      )
      else greatest(2 - current_mayorship_count, 1)
    end;

    select min(visits.visit_date) + 30
      into current_deadline
    from public.verified_visits as visits
    where visits.user_id = current_user_id
      and visits.stairway_id = p_stairway_id
      and visits.visited_at >= now() - interval '30 days'
      and visits.mayorship_eligible is true;

    current_deadline := coalesce(current_deadline, sf_today + 30);
  end if;

  -- Blocking is mutual in the app's public social surfaces. The competition
  -- and visit count remain global, but neither person should see the other's
  -- display name here.
  if not current_is_mayor
     and current_mayor_user_id is not null
     and exists (
       select 1
       from public.blocked_users as blocks
       where (blocks.blocker_id = current_user_id
              and blocks.blocked_id = current_mayor_user_id)
          or (blocks.blocker_id = current_mayor_user_id
              and blocks.blocked_id = current_user_id)
     ) then
    current_mayor_name := null;
    current_mayor_user_id := null;
  end if;

  return query
  select
    current_total,
    current_rolling,
    did_visit_today,
    current_is_mayor,
    current_mayor_user_id,
    current_mayor_name,
    current_mayor_count,
    current_mayorship_count,
    current_visits_needed,
    current_deadline,
    current_is_eligible;
end;
$$;

-- Called only after the app has completed its existing camera + proximity
-- verification. No photo is uploaded or stored; this records the server time.
create or replace function public.record_verified_visit(
  p_stairway_id uuid
)
returns table (
  new_visit_recorded boolean,
  total_visits bigint,
  rolling_visits bigint,
  visited_today boolean,
  is_mayor boolean,
  mayor_user_id uuid,
  mayor_display_name text,
  mayor_visit_count bigint,
  my_mayorship_visit_count bigint,
  visits_needed bigint,
  deadline date,
  eligible boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  sf_today date := (timezone('America/Los_Angeles', now()))::date;
  counts_for_mayorship boolean := false;
  did_insert boolean := false;
  inserted_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.stairways where id = p_stairway_id
  ) then
    raise exception 'Unknown stairway';
  end if;

  select
    coalesce(settings.leaderboard_opt_in, false)
      and nullif(trim(settings.display_name), '') is not null
    into counts_for_mayorship
  from public.user_settings as settings
  where settings.user_id = current_user_id;

  counts_for_mayorship := coalesce(counts_for_mayorship, false);

  -- Preserve the original Spotted date while upgrading or refreshing the
  -- lifetime verification summary used by badges and the main leaderboard.
  insert into public.check_ins (
    user_id,
    stairway_id,
    verification_method,
    verified_at
  ) values (
    current_user_id,
    p_stairway_id,
    'photo-verified',
    now()
  )
  on conflict (user_id, stairway_id) do update
  set
    verification_method = 'photo-verified',
    verified_at = excluded.verified_at;

  insert into public.verified_visits (
    user_id,
    stairway_id,
    visited_at,
    visit_date,
    mayorship_eligible
  ) values (
    current_user_id,
    p_stairway_id,
    now(),
    sf_today,
    counts_for_mayorship
  )
  on conflict (user_id, stairway_id, visit_date) do nothing;

  get diagnostics inserted_rows = row_count;
  did_insert := inserted_rows > 0;

  return query
  select
    did_insert,
    summary.total_visits,
    summary.rolling_visits,
    summary.visited_today,
    summary.is_mayor,
    summary.mayor_user_id,
    summary.mayor_display_name,
    summary.mayor_visit_count,
    summary.my_mayorship_visit_count,
    summary.visits_needed,
    summary.deadline,
    summary.eligible
  from public.get_stairway_visit_summary(p_stairway_id) as summary;
end;
$$;

revoke all on table public.verified_visits from anon, authenticated;
revoke all on table public.stairway_mayors from anon, authenticated;
grant select on table public.verified_visits to authenticated;

revoke all on function public.refresh_stairway_mayor(uuid) from public;
revoke all on function public.reset_mayorships_on_leaderboard_opt_out()
  from public;
revoke all on function public.get_my_verified_visit_history(uuid) from public;
revoke all on function public.get_stairway_visit_summary(uuid) from public;
revoke all on function public.record_verified_visit(uuid) from public;

grant execute on function public.get_my_verified_visit_history(uuid)
  to authenticated;
grant execute on function public.get_stairway_visit_summary(uuid)
  to authenticated;
grant execute on function public.record_verified_visit(uuid)
  to authenticated;

comment on table public.verified_visits is
  'Private repeat photo-verification history; one visit per stairway per SF day.';
comment on column public.verified_visits.mayorship_eligible is
  'True only when the user had public leaderboard participation enabled at check-in time.';
