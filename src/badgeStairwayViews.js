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

export function mergeViewedBadgeStairwayIds(...collections) {
  return new Set(
    collections.flatMap((collection) =>
      collection ? [...collection].filter(Boolean) : []
    )
  );
}

export async function loadSyncedBadgeStairwayIds(
  client,
  userId,
  storage = localStorage
) {
  if (!userId) return new Set();

  const localIds = readViewedBadgeStairwayIds(userId, storage);
  const { data, error } = await client
    .from('user_badge_stairway_views')
    .select('stairway_id')
    .eq('user_id', userId);

  // Keep the previous on-device behavior available if the network is down.
  if (error) return localIds;

  const serverIds = new Set((data || []).map((row) => row.stairway_id));
  const mergedIds = mergeViewedBadgeStairwayIds(localIds, serverIds);
  const localOnlyIds = [...localIds].filter((id) => !serverIds.has(id));

  if (localOnlyIds.length > 0) {
    const { error: migrationError } = await client
      .from('user_badge_stairway_views')
      .upsert(
        localOnlyIds.map((stairwayId) => ({
          user_id: userId,
          stairway_id: stairwayId,
        })),
        { onConflict: 'user_id,stairway_id' }
      );
    // A stale local ID may refer to a stairway that has since been removed.
    // The server copy is additive convenience; never discard usable local or
    // server state merely because the legacy migration could not write.
    if (migrationError) return mergedIds;
  }

  try {
    storage.setItem(viewedBadgeStairwaysKey(userId), JSON.stringify([...mergedIds]));
  } catch {
    // Server state remains authoritative when local storage is unavailable.
  }

  return mergedIds;
}

export async function syncBadgeStairwayViewed(client, userId, stairwayId) {
  if (!userId || !stairwayId) return;
  const { error } = await client
    .from('user_badge_stairway_views')
    .upsert(
      { user_id: userId, stairway_id: stairwayId },
      { onConflict: 'user_id,stairway_id' }
    );
  if (error) throw error;
}
