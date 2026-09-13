alter table public.stairways
  add column if not exists added_at timestamptz;

-- Everything already in the directory becomes the quiet rollout baseline.
-- Future inserts receive their actual database insertion time, and ordinary
-- spreadsheet upserts do not change it.
update public.stairways
set added_at = transaction_timestamp()
where added_at is null;

alter table public.stairways
  alter column added_at set default now(),
  alter column added_at set not null;

create table if not exists public.new_stairway_notice_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seen_through timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.new_stairway_notice_state enable row level security;
revoke all on public.new_stairway_notice_state from anon, authenticated;

create or replace function public.get_new_stairway_notice_state()
returns table (seen_through timestamptz, snapshot_through timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_snapshot timestamptz := clock_timestamp();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.new_stairway_notice_state (user_id, seen_through, updated_at)
  values (current_user_id, current_snapshot, current_snapshot)
  on conflict (user_id) do nothing;

  return query
  select state.seen_through, current_snapshot
  from public.new_stairway_notice_state as state
  where state.user_id = current_user_id;
end;
$$;

create or replace function public.acknowledge_new_stairways(
  p_seen_through timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  safe_seen_through timestamptz := least(p_seen_through, clock_timestamp());
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_seen_through is null then
    raise exception 'Seen-through timestamp is required';
  end if;

  insert into public.new_stairway_notice_state (user_id, seen_through, updated_at)
  values (current_user_id, safe_seen_through, clock_timestamp())
  on conflict (user_id) do update
  set seen_through = greatest(
        public.new_stairway_notice_state.seen_through,
        excluded.seen_through
      ),
      updated_at = clock_timestamp();
end;
$$;

revoke all on function public.get_new_stairway_notice_state() from public;
revoke all on function public.acknowledge_new_stairways(timestamptz) from public;
grant execute on function public.get_new_stairway_notice_state() to authenticated;
grant execute on function public.acknowledge_new_stairways(timestamptz) to authenticated;

comment on column public.stairways.added_at is
  'Stable time this stairway first joined the public directory; sync updates must not modify it.';
comment on table public.new_stairway_notice_state is
  'Account-level cursor for new-stairway alerts, shared across devices.';
