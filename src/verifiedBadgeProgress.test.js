import { describe, expect, it } from 'vitest';
import { fetchVerifiedStairwayIds } from './verifiedBadgeProgress.js';

describe('verified badge progress', () => {
  it('uses verified visit history, deduplicates stairways, and paginates', async () => {
    const pages = [
      [{ stairway_id: 'first' }, { stairway_id: 'first' }],
      [{ stairway_id: 'second' }],
    ];
    let pageIndex = 0;
    const query = {
      select: () => query,
      eq: () => query,
      order: () => query,
      range: async () => ({ data: pages[pageIndex++], error: null }),
    };
    const supabase = { from: () => query };

    const result = await fetchVerifiedStairwayIds(supabase, 'user-1', 2);

    expect(result.error).toBeNull();
    expect([...result.data]).toEqual(['first', 'second']);
    expect(pageIndex).toBe(2);
  });
});
