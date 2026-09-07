import { describe, expect, it } from 'vitest';
import { getStairwayMapGeometry } from './stairwayMapGeometry';

describe('Buena Vista Park stairway map geometry', () => {
  it('maps the stairway south of the tennis courts with two upper branches', () => {
    expect(
      getStairwayMapGeometry('7c7ff48e-a793-4d05-8d59-1353dba4010c')
    ).toEqual({
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

  it('maps the dog-run-to-viewpoint stairway along its screenshot-aligned arc', () => {
    expect(
      getStairwayMapGeometry('b89f9129-0093-4e6e-9416-6dba2faf4afc')
    ).toEqual({
      path: [
        { lat: 37.769224, lng: -122.441634 },
        { lat: 37.769165, lng: -122.441027 },
        { lat: 37.768893, lng: -122.440545 },
      ],
      markerPosition: { lat: 37.769166, lng: -122.441037 },
    });
  });

  it('maps the first viewpoint stairway through its approved pin', () => {
    expect(
      getStairwayMapGeometry('de6e33e6-e733-4bb5-9bc0-58903f561e99')
    ).toEqual({
      path: [
        { lat: 37.76874, lng: -122.44035 },
        { lat: 37.76877, lng: -122.43997 },
        { lat: 37.76877, lng: -122.43969 },
      ],
      markerPosition: { lat: 37.76877, lng: -122.43997 },
    });
  });

  it('maps the second viewpoint stairway and connector through their shared section', () => {
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

  it('maps the Park Hill Drive stairway from its existing pin to its surveyed top', () => {
    expect(
      getStairwayMapGeometry('1ada6624-33fe-438d-9512-5c91dd798b71')
    ).toEqual({
      path: [
        { lat: 37.768539, lng: -122.438841 },
        { lat: 37.7687, lng: -122.4391 },
      ],
      markerPosition: { lat: 37.768539, lng: -122.438841 },
    });
  });

  it('maps the new Buena Vista stairway as a slight arc between its endpoints', () => {
    expect(
      getStairwayMapGeometry('91d57480-6e1e-49d6-afaa-062a7752e068')
    ).toEqual({
      path: [
        { lat: 37.7687, lng: -122.4393 },
        { lat: 37.768647, lng: -122.439435 },
        { lat: 37.76862, lng: -122.43957 },
        { lat: 37.768617, lng: -122.439706 },
      ],
      markerPosition: { lat: 37.768635, lng: -122.439495 },
    });
  });

  it('maps Stairway 4 as a straight segment with a midpoint pin', () => {
    expect(
      getStairwayMapGeometry('73bc96ec-f410-4a91-8ea1-0bd852c2cfaf')
    ).toEqual({
      path: [
        { lat: 37.7691, lng: -122.44025 },
        { lat: 37.76917, lng: -122.44022 },
      ],
      markerPosition: { lat: 37.769135, lng: -122.440235 },
    });
  });

  it('maps the southwest Buena Vista stairway as a straight segment', () => {
    expect(
      getStairwayMapGeometry('b4eecd90-b379-420e-84d9-71b3623f33b6')
    ).toEqual({
      path: [
        { lat: 37.76812, lng: -122.4422 },
        { lat: 37.76838, lng: -122.44234 },
      ],
      markerPosition: { lat: 37.76825, lng: -122.44227 },
    });
  });

  it('maps the short southwest Buena Vista stairway as a straight segment', () => {
    expect(
      getStairwayMapGeometry('60b42948-8150-4f7e-8f3d-f370c270b589')
    ).toEqual({
      path: [
        { lat: 37.76811, lng: -122.4424 },
        { lat: 37.76796, lng: -122.442431 },
      ],
      markerPosition: { lat: 37.768035, lng: -122.442416 },
    });
  });

  it('maps Stairway 5 between its surveyed endpoints', () => {
    expect(
      getStairwayMapGeometry('825e2518-f12b-44a3-8cf5-0cc30588dd60')
    ).toEqual({
      path: [
        { lat: 37.76941, lng: -122.44062 },
        { lat: 37.76968, lng: -122.44077 },
      ],
      markerPosition: { lat: 37.769545, lng: -122.440695 },
    });
  });

  it('maps Stairway 6 as a cross with its two extended arms', () => {
    expect(
      getStairwayMapGeometry('66619a8d-abe0-4134-8b1e-5beda699308b')
    ).toEqual({
      paths: [
        [
          { lat: 37.76961, lng: -122.44096 },
          { lat: 37.76935, lng: -122.44116 },
          { lat: 37.769256, lng: -122.441232 },
        ],
        [
          { lat: 37.76936, lng: -122.441221 },
          { lat: 37.76935, lng: -122.44116 },
          { lat: 37.7693, lng: -122.44085 },
        ],
      ],
      markerPosition: { lat: 37.769374, lng: -122.441142 },
    });
  });

  it('maps the long stairway south of the dog run from the estimated endpoints', () => {
    expect(
      getStairwayMapGeometry('a353819d-2833-4b3a-a2df-74e3ad6548c5')
    ).toEqual({
      path: [
        { lat: 37.768999, lng: -122.44169 },
        { lat: 37.768663, lng: -122.440663 },
      ],
      markerPosition: { lat: 37.768831, lng: -122.441177 },
    });
  });

  it('maps Stairway 7 from near the adjacent stairway through its bend', () => {
    expect(
      getStairwayMapGeometry('41a19659-220c-4b2c-963c-3c436c66aa39')
    ).toEqual({
      path: [
        { lat: 37.76855, lng: -122.44112 },
        { lat: 37.76839, lng: -122.44126 },
        { lat: 37.76829, lng: -122.44102 },
      ],
      markerPosition: { lat: 37.768385, lng: -122.441249 },
    });
  });

  it('maps Stairway 8 through its right-hand bend after the initial flights', () => {
    expect(
      getStairwayMapGeometry('4e855dcb-d2cd-4158-9e83-f5398ac3822f')
    ).toEqual({
      path: [
        { lat: 37.76849, lng: -122.441335 },
        { lat: 37.76845, lng: -122.44135 },
        { lat: 37.76835, lng: -122.44164 },
      ],
      markerPosition: { lat: 37.76849, lng: -122.441335 },
    });
  });
});
