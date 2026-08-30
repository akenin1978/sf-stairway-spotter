-- A photo verification upgrades an existing self-reported check-in in place.
-- Keep RLS ownership intact while allowing that specific UPDATE operation.
drop policy if exists "Users can update their own check-ins" on public.check_ins;

create policy "Users can update their own check-ins"
on public.check_ins
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
