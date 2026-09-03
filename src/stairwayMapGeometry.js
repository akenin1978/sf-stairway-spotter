import { getRatingStyle } from './ratingColors';

// Selected long stairways can opt into a visible route without changing the
// location data used by verification. Paths are ordered from one end of the
// stairway to the other; markerPosition is the user-approved point where the
// existing clickable rating marker should appear.
const STAIRWAY_MAP_GEOMETRY = new Map([
  [
    '1c9b8a42-68a2-47bf-9050-ddbf0b34a61b',
    {
      path: [
        { lat: 37.739072, lng: -122.440903 },
        { lat: 37.739128, lng: -122.440875 },
        { lat: 37.739232, lng: -122.440835 },
        { lat: 37.739303, lng: -122.440782 },
        { lat: 37.739375, lng: -122.440754 },
        { lat: 37.739501, lng: -122.44072 },
        { lat: 37.739601, lng: -122.440703 },
        { lat: 37.739644, lng: -122.440707 },
        { lat: 37.739708, lng: -122.440694 },
        { lat: 37.739816, lng: -122.440773 },
        { lat: 37.739917, lng: -122.440801 },
        { lat: 37.740008, lng: -122.440823 },
      ],
      markerPosition: { lat: 37.739601, lng: -122.440703 },
    },
  ],
  [
    '526fcc02-33b6-4c6b-a98e-b1fafc23ddc9',
    {
      paths: [
        [
          { lat: 37.7423137, lng: -122.4414098 },
          { lat: 37.742337, lng: -122.441429 },
          { lat: 37.74248, lng: -122.441622 },
          { lat: 37.742338, lng: -122.441843 },
        ],
        [
          { lat: 37.7423137, lng: -122.4414098 },
          { lat: 37.742393, lng: -122.441354 },
        ],
        [
          { lat: 37.7423137, lng: -122.4414098 },
          { lat: 37.742281, lng: -122.441387 },
          { lat: 37.742119, lng: -122.441302 },
        ],
      ],
      markerPosition: { lat: 37.7423137, lng: -122.4414098 },
    },
  ],
  [
    'b51ba561-0649-4d22-8398-25558c10cf55',
    {
      paths: [
        [
          { lat: 37.7415939, lng: -122.4407831 },
          { lat: 37.741552, lng: -122.440777 },
          { lat: 37.7415426, lng: -122.4407418 },
          { lat: 37.7415382, lng: -122.4407005 },
          { lat: 37.7415536, lng: -122.440664 },
          { lat: 37.741591, lng: -122.440612 },
        ],
        [
          { lat: 37.7415939, lng: -122.4407831 },
          { lat: 37.741579, lng: -122.440806 },
          { lat: 37.7416042, lng: -122.440815 },
          { lat: 37.7416335, lng: -122.4408037 },
          { lat: 37.7416767, lng: -122.4407906 },
          { lat: 37.7417148, lng: -122.4408066 },
          { lat: 37.7417455, lng: -122.4408338 },
          { lat: 37.7417675, lng: -122.4408703 },
          { lat: 37.741788, lng: -122.4409126 },
          { lat: 37.7418122, lng: -122.4409435 },
          { lat: 37.7418466, lng: -122.4409679 },
          { lat: 37.7418847, lng: -122.4409942 },
          { lat: 37.741939, lng: -122.441026 },
        ],
        [
          { lat: 37.7415939, lng: -122.4407831 },
          { lat: 37.741592, lng: -122.440842 },
          { lat: 37.7416261, lng: -122.440876 },
          { lat: 37.7416642, lng: -122.4409107 },
          { lat: 37.7416994, lng: -122.4409445 },
          { lat: 37.7417053, lng: -122.4409679 },
          { lat: 37.7416818, lng: -122.4409951 },
          { lat: 37.7416518, lng: -122.4410139 },
          { lat: 37.7416173, lng: -122.4410308 },
          { lat: 37.741591, lng: -122.441073 },
          { lat: 37.7415558, lng: -122.4410955 },
          { lat: 37.7415162, lng: -122.4410955 },
          { lat: 37.7414987, lng: -122.4411161 },
          { lat: 37.7415023, lng: -122.4411414 },
          { lat: 37.7414554, lng: -122.4411414 },
          { lat: 37.7413763, lng: -122.4411321 },
          { lat: 37.7413089, lng: -122.4411011 },
          { lat: 37.7412379, lng: -122.4410767 },
          { lat: 37.741174, lng: -122.441045 },
        ],
      ],
      markerPosition: { lat: 37.7415939, lng: -122.4407831 },
    },
  ],
  [
    'a4ea0580-c0cd-43c3-8dab-5c9ea9fccfe7',
    {
      path: [
        { lat: 37.74087, lng: -122.44192 },
        { lat: 37.74094, lng: -122.44168 },
        { lat: 37.74121, lng: -122.44192 },
        { lat: 37.74134, lng: -122.44186 },
        { lat: 37.7412878, lng: -122.4418229 },
        { lat: 37.7412217, lng: -122.4417578 },
        { lat: 37.7411556, lng: -122.4416743 },
        { lat: 37.7410784, lng: -122.4415535 },
        { lat: 37.7410343, lng: -122.4414421 },
        { lat: 37.7410027, lng: -122.4413678 },
        { lat: 37.7409645, lng: -122.4412656 },
        { lat: 37.74093, lng: -122.44117 },
      ],
      markerPosition: { lat: 37.7409, lng: -122.4419 },
    },
  ],
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
  [
    '7c7ff48e-a793-4d05-8d59-1353dba4010c',
    {
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
    },
  ],
  [
    'b89f9129-0093-4e6e-9416-6dba2faf4afc',
    {
      paths: [
        [
          { lat: 37.7691, lng: -122.4417 },
          { lat: 37.769, lng: -122.4409 },
          { lat: 37.769056, lng: -122.440528 },
        ],
        [
          { lat: 37.769, lng: -122.4409 },
          { lat: 37.7690406, lng: -122.4408919 },
        ],
      ],
      markerPosition: { lat: 37.769002, lng: -122.440918 },
    },
  ],
  [
    'de6e33e6-e733-4bb5-9bc0-58903f561e99',
    {
      path: [
        { lat: 37.76874, lng: -122.44035 },
        { lat: 37.76877, lng: -122.43997 },
        { lat: 37.76877, lng: -122.43969 },
      ],
      markerPosition: { lat: 37.76877, lng: -122.43997 },
    },
  ],
  [
    'b3576a29-c240-4725-b71a-827a7fb9e75e',
    {
      path: [
        { lat: 37.76895, lng: -122.43984 },
        { lat: 37.76892, lng: -122.44024 },
        { lat: 37.76883, lng: -122.4403 },
      ],
      markerPosition: { lat: 37.768935, lng: -122.44004 },
    },
  ],
  [
    '31bd7072-aa47-4888-a625-2efb2b3c1db3',
    {
      path: [
        { lat: 37.76919, lng: -122.44011 },
        { lat: 37.76892, lng: -122.44024 },
        { lat: 37.76883, lng: -122.4403 },
      ],
      markerPosition: { lat: 37.769055, lng: -122.440175 },
    },
  ],
  [
    '1ada6624-33fe-438d-9512-5c91dd798b71',
    {
      path: [
        { lat: 37.7685422, lng: -122.4388154 },
        { lat: 37.7687, lng: -122.4391 },
      ],
      markerPosition: { lat: 37.7685422, lng: -122.4388154 },
    },
  ],
  [
    '91d57480-6e1e-49d6-afaa-062a7752e068',
    {
      path: [
        { lat: 37.76868, lng: -122.43928 },
        { lat: 37.7686, lng: -122.4397 },
      ],
      markerPosition: { lat: 37.76864, lng: -122.43949 },
    },
  ],
  [
    '73bc96ec-f410-4a91-8ea1-0bd852c2cfaf',
    {
      path: [
        { lat: 37.7692, lng: -122.4402 },
        { lat: 37.7693, lng: -122.4408 },
      ],
      markerPosition: { lat: 37.76925, lng: -122.4405 },
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
