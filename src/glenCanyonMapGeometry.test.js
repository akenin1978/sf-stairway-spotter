import { describe, expect, it } from 'vitest';
import { getStairwayMapGeometry } from './stairwayMapGeometry';

const GLEN_CANYON_ROUTES = [
  {
    id: '1c9b8a42-68a2-47bf-9050-ddbf0b34a61b',
    markerPosition: { lat: 37.739601, lng: -122.440703 },
    pathCount: 1,
  },
  {
    id: '526fcc02-33b6-4c6b-a98e-b1fafc23ddc9',
    markerPosition: { lat: 37.7423137, lng: -122.4414098 },
    pathCount: 3,
  },
  {
    id: 'b51ba561-0649-4d22-8398-25558c10cf55',
    markerPosition: { lat: 37.7415939, lng: -122.4407831 },
    pathCount: 3,
  },
  {
    id: 'a4ea0580-c0cd-43c3-8dab-5c9ea9fccfe7',
    markerPosition: { lat: 37.7409, lng: -122.4419 },
    pathCount: 1,
  },
];

describe('Glen Canyon Park stairway map geometry', () => {
  it('provides the approved route shape and marker for all four stairways', () => {
    for (const route of GLEN_CANYON_ROUTES) {
      const geometry = getStairwayMapGeometry(route.id);
      const paths = geometry.paths || [geometry.path];

      expect(geometry.markerPosition).toEqual(route.markerPosition);
      expect(paths).toHaveLength(route.pathCount);
      expect(paths.every((path) => path.length >= 2)).toBe(true);
    }
  });

  it('keeps every Christopher Playground and Crags Court branch joined', () => {
    for (const route of GLEN_CANYON_ROUTES.filter(
      ({ pathCount }) => pathCount === 3
    )) {
      const geometry = getStairwayMapGeometry(route.id);
      expect(geometry.paths.map((path) => path[0])).toEqual([
        route.markerPosition,
        route.markerPosition,
        route.markerPosition,
      ]);
    }
  });
});
