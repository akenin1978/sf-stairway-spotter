export const KNOWN_STAIRWAY_IDS_KEY =
  'sf-stairway-spotter:known-stairway-ids:v1';
export const ROLLOUT_BASELINE_COUNT = 1238;

function newestFirst(stairways) {
  const timestamp = (row) => Date.parse(row.updated_at || '') || 0;
  return [...stairways].sort((a, b) => timestamp(b) - timestamp(a));
}

export function findNewStairwayNotice(stairways, storedValue, isReturningUser = false) {
  // The count at the moment this feature ships lets the very first new
  // stairway trigger the celebration even for somebody who did not open the
  // app once between the feature deployment and that database addition.
  if (!storedValue) {
    if (!isReturningUser) return null;
    const addedCount = stairways.length - ROLLOUT_BASELINE_COUNT;
    if (addedCount <= 0) return null;
    const additions = newestFirst(stairways).slice(0, addedCount);
    return {
      stairway: additions[0],
      stairways: additions,
      addedCount,
      stairwayCount: stairways.length,
    };
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
