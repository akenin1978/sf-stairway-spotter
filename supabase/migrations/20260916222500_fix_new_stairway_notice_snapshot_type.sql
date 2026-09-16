-- `current_time` is also a PostgreSQL SQL value function whose type is
-- `time with time zone`. In the previous PL/pgSQL body, the RETURN QUERY
-- resolved that built-in instead of the local timestamptz variable, causing
-- every authenticated notice check to fail with a return-type mismatch.
create or replace function public.get_new_stairway_notice_state()
returns table(seen_through timestamptz, snapshot_through timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot_at timestamptz := now();
  legacy_collection_through constant timestamptz :=
    '2026-09-15 21:50:05.276012+00'::timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Sign-in required';
  end if;

  insert into public.user_new_stairway_notice_state (user_id, seen_through)
  values (auth.uid(), legacy_collection_through)
  on conflict (user_id) do nothing;

  return query
  select state.seen_through, snapshot_at
  from public.user_new_stairway_notice_state state
  where state.user_id = auth.uid();
end;
$$;

revoke all on function public.get_new_stairway_notice_state() from public;
grant execute on function public.get_new_stairway_notice_state() to authenticated;
