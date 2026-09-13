import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  findNewStairwayNotice,
  knownStairwayIdsKey,
  serializeKnownStairwayIds,
} from './newStairwayNotice';

const stairways = [
  { id: 'older', updated_at: '2026-08-20T12:00:00Z' },
  { id: 'newest', updated_at: '2026-08-27T12:00:00Z' },
];
const mapSource = readFileSync(
  new URL('./components/StairwayMap.jsx', import.meta.url),
  'utf8'
);

describe('new stairway notices', () => {
  it('stays quiet when there is no previous snapshot', () => {
    expect(findNewStairwayNotice(stairways, null)).toBeNull();
  });

  it('does not interrupt a brand-new visitor with a celebration', () => {
    const rows = Array.from({ length: 1239 }, (_, index) => ({
      id: `stairway-${index}`,
      updated_at: '2026-08-28T12:00:00Z',
    }));
    expect(findNewStairwayNotice(rows, null)).toBeNull();
  });

  it('keeps snapshots separate for each signed-in account', () => {
    expect(knownStairwayIdsKey('reviewer')).toBe(
      'sf-stairway-spotter:known-stairway-ids:v2:reviewer'
    );
    expect(knownStairwayIdsKey('another-user')).not.toBe(
      knownStairwayIdsKey('reviewer')
    );
    expect(knownStairwayIdsKey(null)).toBeNull();
  });

  it('stays quiet when every stairway was already known', () => {
    expect(findNewStairwayNotice(stairways, '["older","newest"]')).toBeNull();
  });

  it('chooses the most recently updated genuinely new stairway', () => {
    expect(findNewStairwayNotice(stairways, '[]')).toEqual({
      stairway: stairways[1],
      stairways: [stairways[1], stairways[0]],
      addedCount: 2,
      stairwayCount: 2,
    });
  });

  it('serializes the exact IDs for the next visit', () => {
    expect(serializeKnownStairwayIds(stairways)).toBe('["older","newest"]');
  });

  it('does not mark additions known until the notice is acknowledged', () => {
    expect(mapSource).toContain('snapshotValue: serializeKnownStairwayIds(allRows)');
    expect(mapSource).toContain('function acknowledgeNewStairwayNotice');
    expect(mapSource).toContain('onDismiss={() => acknowledgeNewStairwayNotice()}');
  });
});
