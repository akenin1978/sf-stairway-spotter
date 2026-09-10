create or replace function public.require_friend_request_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.user_settings
    where user_id = new.requester_id
      and nullif(trim(display_name), '') is not null
  ) then
    raise exception 'Add a username before sending friend requests';
  end if;
  return new;
end;
$$;

drop trigger if exists require_friend_request_username on public.friendships;
create trigger require_friend_request_username
before insert on public.friendships
for each row execute function public.require_friend_request_username();

-- Existing pending requests are deliberately preserved. The app displays a
-- neutral "A stairway spotter" fallback when an older request has no username.
revoke all on function public.require_friend_request_username() from public;
