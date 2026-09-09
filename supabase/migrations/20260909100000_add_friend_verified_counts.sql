-- Accepted friends may see one progress aggregate: the number of unique
-- stairways the other person has photo-verified. Raw visits, dates, locations,
-- photos, and self-reported Spotted entries remain private.
create or replace function public.get_friend_verified_counts()
returns table (
  user_id uuid,
  verified_count bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with accepted_friends as (
    select case
      when friendships.requester_id = auth.uid()
        then friendships.addressee_id
      else friendships.requester_id
    end as friend_user_id
    from public.friendships as friendships
    where friendships.status = 'accepted'
      and (
        friendships.requester_id = auth.uid()
        or friendships.addressee_id = auth.uid()
      )
  )
  select
    friends.friend_user_id as user_id,
    count(distinct checkins.stairway_id)::bigint as verified_count
  from accepted_friends as friends
  left join public.check_ins as checkins
    on checkins.user_id = friends.friend_user_id
    and checkins.verification_method = 'photo-verified'
  group by friends.friend_user_id;
$$;

revoke all on function public.get_friend_verified_counts() from public;
revoke execute on function public.get_friend_verified_counts() from anon;
grant execute on function public.get_friend_verified_counts() to authenticated;

comment on function public.get_friend_verified_counts() is
  'Returns only unique photo-verified stairway totals for the signed-in user''s accepted friends.';
