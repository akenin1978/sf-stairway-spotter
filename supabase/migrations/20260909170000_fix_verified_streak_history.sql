-- Streaks are based on every verified visit, including repeat visits. The
-- lifetime check_ins row is retained for pre-history compatibility, while the
-- append-only verified_visits table supplies the complete modern history.
create or replace function public.get_my_streak()
returns table (
  current_streak integer,
  longest_streak integer
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with visit_weeks as (
    select distinct
      date_trunc(
        'week',
        timezone('America/Los_Angeles', checkins.verified_at)
      )::date as week_start
    from public.check_ins as checkins
    where checkins.user_id = auth.uid()
      and checkins.verification_method = 'photo-verified'
      and checkins.verified_at is not null

    union

    select distinct
      date_trunc('week', visits.visit_date::timestamp)::date as week_start
    from public.verified_visits as visits
    where visits.user_id = auth.uid()
  ),
  numbered_weeks as (
    select
      week_start,
      row_number() over (order by week_start) as week_number
    from visit_weeks
  ),
  runs as (
    select
      count(*)::integer as run_length,
      max(week_start) as run_end
    from numbered_weeks
    group by week_start - (week_number::integer * 7)
  ),
  summary as (
    select
      coalesce(max(run_length), 0)::integer as longest,
      coalesce(
        max(run_length) filter (
          where run_end >=
            date_trunc(
              'week',
              timezone('America/Los_Angeles', now())
            )::date - 7
        ),
        0
      )::integer as current
    from runs
  )
  select summary.current, summary.longest
  from summary;
$$;

revoke all on function public.get_my_streak() from public;
revoke execute on function public.get_my_streak() from anon;
grant execute on function public.get_my_streak() to authenticated;

comment on function public.get_my_streak() is
  'Returns private SF-calendar weekly streaks using complete verified visit history.';
