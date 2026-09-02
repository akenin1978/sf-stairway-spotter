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
          { lat: 37.76899, lng: -122.43987 },
        ],
        [
          { lat: 37.76904, lng: -122.43971 },
          { lat: 37.76908, lng: -122.43988 },
        ],
      ],
      markerPosition: { lat: 37.76917, lng: -122.4396 },
    });
  });

  it('maps the dog-run-to-viewpoint stairway with its short side branch', () => {
    expect(
      getStairwayMapGeometry('b89f9129-0093-4e6e-9416-6dba2faf4afc')
    ).toEqual({
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
        { lat: 37.76883, lng: -122.4403 },
      ],
      markerPosition: { lat: 37.768935, lng: -122.44004 },
    });

    expect(
      getStairwayMapGeometry('31bd7072-aa47-4888-a625-2efb2b3c1db3')
    ).toEqual({
      path: [
        { lat: 37.76919, lng: -122.44011 },
        { lat: 37.76892, lng: -122.44024 },
        { lat: 37.76883, lng: -122.4403 },
      ],
      markerPosition: { lat: 37.769055, lng: -122.440175 },
    });
  });
});
