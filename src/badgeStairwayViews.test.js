import { describe, expect, it } from 'vitest';
import {
  markBadgeStairwayViewed,
  readViewedBadgeStairwayIds,
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
});
