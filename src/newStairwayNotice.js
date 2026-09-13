const KNOWN_STAIRWAY_IDS_KEY_PREFIX =
  'sf-stairway-spotter:known-stairway-ids:v2';

export function knownStairwayIdsKey(userId) {
  return userId ? `${KNOWN_STAIRWAY_IDS_KEY_PREFIX}:${userId}` : null;
}

function newestFirst(stairways) {
  const timestamp = (row) => Date.parse(row.updated_at || '') || 0;
  return [...stairways].sort((a, b) => timestamp(b) - timestamp(a));
}

export function findNewStairwayNotice(stairways, storedValue) {
  // A missing account-specific snapshot always means this is the account's
  // first visit. Establish a quiet baseline instead of treating the entire
  // map as newly added.
  if (!storedValue) {
    return null;
  }

  let storedIds;
  try {
    storedIds = JSON.parse(storedValue);
  } catch {
    return null;
  }
  if (!Array.isArray(storedIds)) return null;

  const knownIds = new Set(storedIds);
  const additions = stairways.filter((row) => !knownIds.has(row.id));
  if (additions.length === 0) return null;

  const sortedAdditions = newestFirst(additions);

  return {
    stairway: sortedAdditions[0],
    stairways: sortedAdditions,
    addedCount: additions.length,
    stairwayCount: stairways.length,
  };
}

export function serializeKnownStairwayIds(stairways) {
  return JSON.stringify(stairways.map((row) => row.id));
}
