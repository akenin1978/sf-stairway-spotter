const KNOWN_STAIRWAY_IDS_KEY_PREFIX =
  'sf-stairway-spotter:known-stairway-ids:v2';
const DEVICE_KNOWN_STAIRWAY_IDS_KEY =
  `${KNOWN_STAIRWAY_IDS_KEY_PREFIX}:this-device`;

export function knownStairwayIdsKey(userId) {
  return userId
    ? `${KNOWN_STAIRWAY_IDS_KEY_PREFIX}:${userId}`
    : DEVICE_KNOWN_STAIRWAY_IDS_KEY;
}

function timestampMicroseconds(value) {
  const milliseconds = Date.parse(value || '');
  if (!Number.isFinite(milliseconds)) return null;

  // PostgreSQL timestamps can include six fractional digits, while Date.parse
  // keeps only three. Preserve the remaining microseconds so two events in the
  // same millisecond are still ordered correctly.
  const fraction = String(value).match(/\.(\d+)(?:Z|[+-]\d{2}(?::?\d{2})?)$/)?.[1] || '';
  const microsecondRemainder = Number(fraction.padEnd(6, '0').slice(3, 6) || 0);
  return (milliseconds * 1000) + microsecondRemainder;
}

function newestFirst(stairways) {
  const timestamp = (row) =>
    timestampMicroseconds(row.added_at || row.updated_at || '') || 0;
  return [...stairways].sort((a, b) => timestamp(b) - timestamp(a));
}

export function findServerNewStairwayNotice(
  stairways,
  seenThrough,
  snapshotThrough
) {
  const seenAt = timestampMicroseconds(seenThrough);
  const snapshotAt = timestampMicroseconds(snapshotThrough);
  if (!Number.isFinite(seenAt) || !Number.isFinite(snapshotAt)) return null;

  const additions = stairways.filter((row) => {
    const addedAt = timestampMicroseconds(row.added_at);
    return Number.isFinite(addedAt) && addedAt > seenAt && addedAt <= snapshotAt;
  });
  if (additions.length === 0) return null;

  const sortedAdditions = newestFirst(additions);
  return {
    stairway: sortedAdditions[0],
    stairways: sortedAdditions,
    addedCount: sortedAdditions.length,
    stairwayCount: stairways.length,
  };
}

export function findNewStairwayNotice(stairways, storedValue) {
  // A missing snapshot means this account/device has not established a
  // baseline yet. Stay quiet instead of treating the entire map as new.
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
