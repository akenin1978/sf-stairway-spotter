const SEEN_REQUESTS_KEY_PREFIX = 'sf_stairway_seen_friend_requests_';

export function incomingFriendRequests(friends = []) {
  return friends.filter(
    (friend) => !friend.i_am_requester && friend.status === 'pending'
  );
}

export function unseenFriendRequests(friends, seenIds = []) {
  const seen = new Set(seenIds);
  return incomingFriendRequests(friends).filter(
    (friend) => !seen.has(friend.friendship_id)
  );
}

export function friendRequestNotice(requests) {
  if (!requests.length) return '';
  if (requests.length === 1) {
    const request = requests[0];
    const username = request.friend_display_name || 'A stairway spotter';
    return `${username} sent you a friend request.`;
  }
  return `You have ${requests.length} new friend requests.`;
}

export function seenFriendRequestStorageKey(userId) {
  return `${SEEN_REQUESTS_KEY_PREFIX}${userId}`;
}
