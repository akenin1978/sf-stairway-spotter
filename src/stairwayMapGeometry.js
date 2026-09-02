import { getRatingStyle } from './ratingColors';

// Selected long stairways can opt into a visible route without changing the
// location data used by verification. Paths are ordered from one end of the
// stairway to the other; markerPosition is the user-approved point where the
// existing clickable rating marker should appear.
const STAIRWAY_MAP_GEOMETRY = new Map([
  [
    'd3a8fe75-6c9b-4b2a-af53-d52f7ffca045',
    {
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
  ],
  [
    '59d81805-0a81-4b2f-9bb8-1a1fbe05944e',
    {
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
  ],
  [
    'f0de1ba3-52c5-4535-af39-ed0957cdfa2a',
    {
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
  ],
]);

export function getStairwayMapGeometry(stairwayId) {
  return STAIRWAY_MAP_GEOMETRY.get(stairwayId) || null;
}

export function getStairwayMarkerPosition(stairway) {
  return (
    getStairwayMapGeometry(stairway?.id)?.markerPosition || {
      lat: stairway.latitude,
      lng: stairway.longitude,
    }
  );
}

// Lines and markers deliberately share the exact same rating-color source.
// A rating change therefore updates both without maintaining two palettes.
export function getStairwayRouteColor(stairway) {
  return getRatingStyle(stairway?.rating).color;
}
