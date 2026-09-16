-- Keep each person's dismissed badge-stairway indicators consistent across
-- the web app and native installations. The client also retains a local copy
-- so tapping through cards remains responsive while temporarily offline.
create table if not exists public.user_badge_stairway_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  stairway_id uuid not null references public.stairways(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, stairway_id)
);

create index if not exists user_badge_stairway_views_user_idx
  on public.user_badge_stairway_views (user_id, viewed_at desc);

alter table public.user_badge_stairway_views enable row level security;

drop policy if exists "Users can view their own badge stairway views"
  on public.user_badge_stairway_views;
create policy "Users can view their own badge stairway views"
on public.user_badge_stairway_views
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own badge stairway views"
  on public.user_badge_stairway_views;
create policy "Users can add their own badge stairway views"
on public.user_badge_stairway_views
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own badge stairway views"
  on public.user_badge_stairway_views;
create policy "Users can update their own badge stairway views"
on public.user_badge_stairway_views
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
