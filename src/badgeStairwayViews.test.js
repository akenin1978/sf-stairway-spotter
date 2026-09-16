import { describe, expect, it } from 'vitest';
import {
  loadSyncedBadgeStairwayIds,
  markBadgeStairwayViewed,
  mergeViewedBadgeStairwayIds,
  readViewedBadgeStairwayIds,
  syncBadgeStairwayViewed,
  viewedBadgeStairwaysKey,
} from './badgeStairwayViews';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('badge stairway views', () => {
  it('keeps viewed notifications separate for each account', () => {
    expect(viewedBadgeStairwaysKey('one')).not.toBe(viewedBadgeStairwaysKey('two'));
  });

  it('clears a stairway notification after its card is viewed', () => {
    const storage = memoryStorage();
    markBadgeStairwayViewed('person', 'stairs-1', storage);
    markBadgeStairwayViewed('person', 'stairs-2', storage);
    expect([...readViewedBadgeStairwayIds('person', storage)]).toEqual(['stairs-1', 'stairs-2']);
  });

  it('merges local and server views without duplicates', () => {
    expect([
      ...mergeViewedBadgeStairwayIds(
        new Set(['stairs-1', 'stairs-2']),
        new Set(['stairs-2', 'stairs-3'])
      ),
    ]).toEqual(['stairs-1', 'stairs-2', 'stairs-3']);
  });

  it('loads server views and migrates older local views to the account', async () => {
    const storage = memoryStorage();
    markBadgeStairwayViewed('person', 'local-stairs', storage);
    let upserted = [];
    const client = {
      from: () => ({
        select: () => ({
          eq: async () => ({ data: [{ stairway_id: 'server-stairs' }], error: null }),
        }),
        upsert: async (rows) => {
          upserted = rows;
          return { error: null };
        },
      }),
    };

    const ids = await loadSyncedBadgeStairwayIds(client, 'person', storage);
    expect([...ids]).toEqual(['local-stairs', 'server-stairs']);
    expect(upserted).toEqual([
      { user_id: 'person', stairway_id: 'local-stairs' },
    ]);
  });

  it('writes a newly viewed stairway to the signed-in account', async () => {
    let write = null;
    const client = {
      from: () => ({
        upsert: async (row, options) => {
          write = { row, options };
          return { error: null };
        },
      }),
    };

    await syncBadgeStairwayViewed(client, 'person', 'stairs-1');
    expect(write).toEqual({
      row: { user_id: 'person', stairway_id: 'stairs-1' },
      options: { onConflict: 'user_id,stairway_id' },
    });
  });
});
