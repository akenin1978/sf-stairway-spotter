alter table public.stairways
  add column if not exists active boolean not null default true;

create index if not exists stairways_active_idx
  on public.stairways (active);
