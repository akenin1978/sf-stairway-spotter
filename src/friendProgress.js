export function addVerifiedCountsToFriends(friends = [], counts = []) {
  const byUserId = new Map(
    counts.map((row) => [row.user_id, Number(row.verified_count) || 0])
  );

  return friends.map((friend) => ({
    ...friend,
    verified_count:
      friend.status === 'accepted'
        ? (byUserId.get(friend.friend_user_id) ?? 0)
        : null,
  }));
}

export function verifiedFriendLabel(count) {
  const total = Number(count) || 0;
  return `${total.toLocaleString()} verified`;
}
