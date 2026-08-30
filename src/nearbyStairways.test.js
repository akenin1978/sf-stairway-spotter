import { describe, expect, it } from 'vitest';
import { addNearbyThumbnailPhotos } from './nearbyStairways.js';

describe('nearby stairway thumbnails', () => {
  const nearby = [
    {
      stairway: { id: 'one', description: 'First stairway' },
      distanceMeters: 20,
    },
    {
      stairway: { id: 'two', description: 'Second stairway' },
      distanceMeters: 35,
    },
  ];

  it('adds thumbnails without changing the nearby results', () => {
    const result = addNearbyThumbnailPhotos(nearby, [
      { id: 'two', direct_photo_url: 'https://example.com/two.jpg' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].stairway.description).toBe('First stairway');
    expect(result[1].stairway.direct_photo_url).toBe(
      'https://example.com/two.jpg'
    );
  });

  it('keeps Check In usable when thumbnail loading returns nothing', () => {
    const result = addNearbyThumbnailPhotos(nearby, []);

    expect(result.map((item) => item.stairway.id)).toEqual(['one', 'two']);
    expect(result.every((item) => item.stairway.direct_photo_url === null)).toBe(
      true
    );
  });
});
