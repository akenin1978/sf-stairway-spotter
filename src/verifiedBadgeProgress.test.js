import { describe, expect, it } from 'vitest';
import { fetchVerifiedStairwayIds } from './verifiedBadgeProgress.js';

describe('verified badge progress', () => {
  it('uses the lifetime verified check-in summary, deduplicates, and paginates', async () => {
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
    const tables = [];
    const filters = [];
    query.eq = (column, value) => {
      filters.push([column, value]);
      return query;
    };
    const supabase = {
      from: (table) => {
        tables.push(table);
        return query;
      },
    };

    const result = await fetchVerifiedStairwayIds(supabase, 'user-1', 2);

    expect(result.error).toBeNull();
    expect([...result.data]).toEqual(['first', 'second']);
    expect(pageIndex).toBe(2);
    expect(tables).toEqual(['check_ins', 'check_ins']);
    expect(filters).toContainEqual(['verification_method', 'photo-verified']);
  });
});
