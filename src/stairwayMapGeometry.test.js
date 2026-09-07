import { describe, expect, it } from 'vitest';
import {
  getStairwayMapGeometry,
  getStairwayMarkerPosition,
  getStairwayRouteColor,
} from './stairwayMapGeometry';

const BERNAL_ROUTES = [
  {
    id: 'd3a8fe75-6c9b-4b2a-af53-d52f7ffca045',
    path: [
      { lat: 37.74297, lng: -122.4167 },
      { lat: 37.742968, lng: -122.416468 },
      { lat: 37.74304, lng: -122.41636 },
      { lat: 37.743055, lng: -122.416315 },
      { lat: 37.743082, lng: -122.416298 },
      { lat: 37.743106, lng: -122.416275 },
      { lat: 37.743212, lng: -122.416165 },
      { lat: 37.74324, lng: -122.41612 },
    ],
    markerPosition: { lat: 37.74304, lng: -122.41636 },
  },
  {
    id: '59d81805-0a81-4b2f-9bb8-1a1fbe05944e',
    path: [
      { lat: 37.74251, lng: -122.414379 },
      { lat: 37.742528, lng: -122.414383 },
      { lat: 37.742543, lng: -122.414379 },
      { lat: 37.742556, lng: -122.414364 },
      { lat: 37.742571, lng: -122.414329 },
      { lat: 37.742583, lng: -122.414294 },
      { lat: 37.742612, lng: -122.414232 },
      { lat: 37.74275, lng: -122.414065 },
    ],
    markerPosition: { lat: 37.742612, lng: -122.414232 },
  },
  {
    id: 'f0de1ba3-52c5-4535-af39-ed0957cdfa2a',
    path: [
      { lat: 37.743022, lng: -122.410136 },
      { lat: 37.743035, lng: -122.41022 },
      { lat: 37.743012, lng: -122.410285 },
      { lat: 37.742957, lng: -122.410439 },
      { lat: 37.742925, lng: -122.41056 },
      { lat: 37.74288, lng: -122.41068 },
      { lat: 37.74288, lng: -122.41077 },
      { lat: 37.74291, lng: -122.41085 },
      { lat: 37.74294, lng: -122.41093 },
      { lat: 37.742975, lng: -122.41101 },
    ],
    markerPosition: { lat: 37.742957, lng: -122.410439 },
  },
];

describe('stairway map geometry', () => {
  it('maps the second and connecting Buena Vista viewpoint stairways through their shared section', () => {
    expect(
      getStairwayMapGeometry('b3576a29-c240-4725-b71a-827a7fb9e75e')
    ).toEqual({
      path: [
        { lat: 37.76895, lng: -122.43984 },
        { lat: 37.76892, lng: -122.44024 },
        { lat: 37.768858, lng: -122.440451 },
      ],
      markerPosition: { lat: 37.768935, lng: -122.44004 },
    });

    expect(
      getStairwayMapGeometry('31bd7072-aa47-4888-a625-2efb2b3c1db3')
    ).toEqual({
      path: [
        { lat: 37.76919, lng: -122.44011 },
        { lat: 37.76892, lng: -122.44024 },
        { lat: 37.768858, lng: -122.440451 },
      ],
      markerPosition: { lat: 37.769055, lng: -122.440175 },
    });
  });

  it('maps the first Buena Vista viewpoint stairway through its approved pin', () => {
    const geometry = getStairwayMapGeometry(
      'de6e33e6-e733-4bb5-9bc0-58903f561e99'
    );

    expect(geometry).toEqual({
      path: [
        { lat: 37.76874, lng: -122.44035 },
        { lat: 37.76877, lng: -122.43997 },
        { lat: 37.76877, lng: -122.43969 },
      ],
      markerPosition: { lat: 37.76877, lng: -122.43997 },
    });
  });

  it('maps the Buena Vista viewpoint stairway with a 15-foot side branch', () => {
    const geometry = getStairwayMapGeometry(
      'b89f9129-0093-4e6e-9416-6dba2faf4afc'
    );

    expect(geometry).toEqual({
      path: [
        { lat: 37.769224, lng: -122.441634 },
        { lat: 37.769165, lng: -122.441027 },
        { lat: 37.768893, lng: -122.440545 },
      ],
      markerPosition: { lat: 37.769166, lng: -122.441037 },
    });
  });

  it('maps the Buena Vista Park stairway as a long run with two upper branches', () => {
    const geometry = getStairwayMapGeometry(
      '7c7ff48e-a793-4d05-8d59-1353dba4010c'
    );

    expect(geometry).toEqual({
      paths: [
        [
          { lat: 37.7694, lng: -122.4394 },
          { lat: 37.76904, lng: -122.43971 },
        ],
        [
          { lat: 37.76904, lng: -122.43971 },
          { lat: 37.76895, lng: -122.43981 },
        ],
        [
          { lat: 37.76904, lng: -122.43971 },
          { lat: 37.76908, lng: -122.43988 },
        ],
      ],
      markerPosition: { lat: 37.76917, lng: -122.4396 },
    });
  });

  it('supports three paths meeting at one marker for a Y-shaped stairway', () => {
    const geometry = getStairwayMapGeometry(
      '526fcc02-33b6-4c6b-a98e-b1fafc23ddc9'
    );

    expect(geometry.paths).toHaveLength(3);
    expect(geometry.paths.map((path) => path[0])).toEqual([
      geometry.markerPosition,
      geometry.markerPosition,
      geometry.markerPosition,
    ]);
  });

  it('joins all three Crags Court branches at its marker', () => {
    const geometry = getStairwayMapGeometry(
      'b51ba561-0649-4d22-8398-25558c10cf55'
    );

    expect(geometry.paths).toHaveLength(3);
    expect(geometry.paths.map((path) => path[0])).toEqual([
      geometry.markerPosition,
      geometry.markerPosition,
      geometry.markerPosition,
    ]);
  });

  it('uses the approved paths and marker positions for selected long stairways', () => {
    for (const route of BERNAL_ROUTES) {
      expect(getStairwayMapGeometry(route.id)).toEqual({
        path: route.path,
        markerPosition: route.markerPosition,
      });
      expect(
        getStairwayMarkerPosition({
          id: route.id,
          latitude: 0,
          longitude: 0,
        })
      ).toEqual(route.markerPosition);
    }
  });

  it('leaves ordinary stairway marker positions unchanged', () => {
    expect(
      getStairwayMarkerPosition({
        id: 'ordinary-stairway',
        latitude: 37.75,
        longitude: -122.42,
      })
    ).toEqual({ lat: 37.75, lng: -122.42 });
  });

  it('always derives the route color from the marker rating palette', () => {
    expect(getStairwayRouteColor({ rating: 3 })).toBe('#FFD600');
    expect(getStairwayRouteColor({ rating: 2 })).toBe('#558B2F');
    expect(getStairwayRouteColor({ rating: 5 })).toBe('#E65100');
  });
});
