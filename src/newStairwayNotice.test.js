import { describe, expect, it } from 'vitest';
import {
  findNewStairwayNotice,
  serializeKnownStairwayIds,
} from './newStairwayNotice';

const stairways = [
  { id: 'older', updated_at: '2026-08-20T12:00:00Z' },
  { id: 'newest', updated_at: '2026-08-27T12:00:00Z' },
];

describe('new stairway notices', () => {
  it('stays quiet when there is no previous snapshot', () => {
    expect(findNewStairwayNotice(stairways, null)).toBeNull();
  });

  it('uses the rollout count to catch the first addition without a snapshot', () => {
    const baseline = Array.from({ length: 1238 }, (_, index) => ({
      id: `baseline-${index}`,
      updated_at: '2026-08-20T12:00:00Z',
    }));
    const firstAddition = {
      id: 'first-addition',
      updated_at: '2026-08-28T12:00:00Z',
    };

    expect(findNewStairwayNotice([...baseline, firstAddition], null, true)).toEqual({
      stairway: firstAddition,
      addedCount: 1,
      stairwayCount: 1239,
    });
  });

  it('does not interrupt a brand-new visitor with a celebration', () => {
    const rows = Array.from({ length: 1239 }, (_, index) => ({
      id: `stairway-${index}`,
      updated_at: '2026-08-28T12:00:00Z',
    }));
    expect(findNewStairwayNotice(rows, null, false)).toBeNull();
  });

  it('stays quiet when every stairway was already known', () => {
    expect(findNewStairwayNotice(stairways, '["older","newest"]')).toBeNull();
  });

  it('chooses the most recently updated genuinely new stairway', () => {
    expect(findNewStairwayNotice(stairways, '[]')).toEqual({
      stairway: stairways[1],
      addedCount: 2,
      stairwayCount: 2,
    });
  });

  it('serializes the exact IDs for the next visit', () => {
    expect(serializeKnownStairwayIds(stairways)).toBe('["older","newest"]');
  });
});
