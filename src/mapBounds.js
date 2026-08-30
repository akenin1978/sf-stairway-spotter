// A deliberately simple service-area box. It covers San Francisco's mainland,
// Alcatraz, Treasure Island and Yerba Buena Island, while excluding the
// surrounding cities. Location-based actions use this stricter box; the map
// itself gets additional room so edge markers can open complete cards.
export const SF_LOCATION_BOUNDS = {
  north: 37.84,
  south: 37.69,
  west: -122.53,
  east: -122.34,
};

// Used only while stairway data is loading. Once it arrives, the restriction
// is calculated from the real outermost markers below.
export const DEFAULT_MAP_RESTRICTION_BOUNDS = {
  north: 37.925,
  south: 37.605,
  west: -122.63,
  east: -122.24,
};

const CARD_PADDING = {
  latitude: 0.085,
  longitude: 0.1,
};

export function isWithinBounds(location, bounds = SF_LOCATION_BOUNDS) {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    return false;
  }

  return (
    location.lat <= bounds.north &&
    location.lat >= bounds.south &&
    location.lng <= bounds.east &&
    location.lng >= bounds.west
  );
}

export function getStairwayMapBounds(stairways) {
  const validStairways = (stairways ?? []).filter(
    (stairway) =>
      Number.isFinite(stairway.latitude) &&
      Number.isFinite(stairway.longitude)
  );

  if (validStairways.length === 0) return DEFAULT_MAP_RESTRICTION_BOUNDS;

  const latitudes = validStairways.map((stairway) => stairway.latitude);
  const longitudes = validStairways.map((stairway) => stairway.longitude);

  return {
    north: Math.max(...latitudes) + CARD_PADDING.latitude,
    south: Math.min(...latitudes) - CARD_PADDING.latitude,
    west: Math.min(...longitudes) - CARD_PADDING.longitude,
    east: Math.max(...longitudes) + CARD_PADDING.longitude,
  };
}
