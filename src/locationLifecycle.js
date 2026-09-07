export const LOCATION_CACHE_MAX_AGE_MS = 60_000;

export function isLocationFresh(
  location,
  updatedAt,
  now = Date.now(),
  maxAgeMs = LOCATION_CACHE_MAX_AGE_MS
) {
  return Boolean(
    location &&
      Number.isFinite(updatedAt) &&
      updatedAt > 0 &&
      now >= updatedAt &&
      now - updatedAt <= maxAgeMs
  );
}
