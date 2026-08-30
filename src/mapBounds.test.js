import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAP_RESTRICTION_BOUNDS,
  SF_LOCATION_BOUNDS,
  getStairwayMapBounds,
  isWithinBounds,
} from './mapBounds';

describe('isWithinBounds', () => {
  it('accepts locations in San Francisco, including Treasure Island', () => {
    expect(isWithinBounds({ lat: 37.7749, lng: -122.4194 })).toBe(true);
    expect(isWithinBounds({ lat: 37.8235, lng: -122.3707 })).toBe(true);
  });

  it('rejects locations outside San Francisco', () => {
    expect(isWithinBounds({ lat: 37.6879, lng: -122.4702 })).toBe(false);
    expect(isWithinBounds({ lat: 37.8044, lng: -122.2712 })).toBe(false);
  });

  it('includes the exact boundary', () => {
    expect(
      isWithinBounds({ lat: SF_LOCATION_BOUNDS.north, lng: SF_LOCATION_BOUNDS.west })
    ).toBe(true);
  });
});

describe('getStairwayMapBounds', () => {
  it('adds modest card room around the outermost stairways', () => {
    const bounds = getStairwayMapBounds([
      { latitude: 37.71, longitude: -122.5 },
      { latitude: 37.82, longitude: -122.36 },
    ]);

    expect(bounds).toEqual({
      north: 37.905,
      south: 37.625,
      west: -122.6,
      east: -122.26,
    });
  });

  it('uses a safe loading boundary when no valid coordinates exist', () => {
    expect(getStairwayMapBounds([])).toBe(DEFAULT_MAP_RESTRICTION_BOUNDS);
  });
});
