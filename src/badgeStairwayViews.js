export function viewedBadgeStairwaysKey(userId) {
  return userId ? `sf_stairway_viewed_badge_stairways_${userId}` : null;
}

export function readViewedBadgeStairwayIds(userId, storage = localStorage) {
  const key = viewedBadgeStairwaysKey(userId);
  if (!key) return new Set();
  try {
    const stored = JSON.parse(storage.getItem(key) || '[]');
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

export function markBadgeStairwayViewed(userId, stairwayId, storage = localStorage) {
  const key = viewedBadgeStairwaysKey(userId);
  if (!key || !stairwayId) return;
  const viewedIds = readViewedBadgeStairwayIds(userId, storage);
  viewedIds.add(stairwayId);
  try {
    storage.setItem(key, JSON.stringify([...viewedIds]));
  } catch {
    // A blocked storage write should not interrupt map browsing.
  }
}
