-- A spreadsheet sync upserts every active stairway, so updated_at cannot tell
-- the app which stairways are genuinely new. Preserve the first-insert time
-- instead, and keep each signed-in person's notice cursor in the database.
alter table public.stairways
  add column if not exists added_at timestamptz not null default now();

create index if not exists stairways_added_at_idx
  on public.stairways (added_at desc);

create table if not exists public.user_new_stairway_notice_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seen_through timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.user_new_stairway_notice_state enable row level security;

-- The client only learns the timestamps needed to determine whether there are
-- new public stairways. On first use, establish a quiet baseline so the whole
-- existing collection is never announced as new.
create or replace function public.get_new_stairway_notice_state()
returns table(seen_through timestamptz, snapshot_through timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_time timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Sign-in required';
  end if;

  insert into public.user_new_stairway_notice_state (user_id, seen_through)
  values (auth.uid(), current_time)
  on conflict (user_id) do nothing;

  return query
  select state.seen_through, current_time
  from public.user_new_stairway_notice_state state
  where state.user_id = auth.uid();
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
begin
  if auth.uid() is null then
    raise exception 'Sign-in required';
  end if;

  insert into public.user_new_stairway_notice_state (
    user_id,
    seen_through,
    updated_at
  )
  values (auth.uid(), p_seen_through, now())
  on conflict (user_id) do update
    set seen_through = greatest(
          public.user_new_stairway_notice_state.seen_through,
          excluded.seen_through
        ),
        updated_at = now();
end;
$$;

revoke all on function public.get_new_stairway_notice_state() from public;
revoke all on function public.acknowledge_new_stairways(timestamptz) from public;
grant execute on function public.get_new_stairway_notice_state() to authenticated;
grant execute on function public.acknowledge_new_stairways(timestamptz) to authenticated;
