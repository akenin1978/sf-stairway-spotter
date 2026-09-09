import { describe, expect, it } from 'vitest';
import {
  goalOrientedNeighborhoodSort,
  statsNeighborhoodGroup,
} from './neighborhoodSort.js';

describe('neighborhood ordering', () => {
  it('shows closest, in-progress, completed, then not-started neighborhoods', () => {
    const neighborhoods = [
      { name: 'Zulu', total: 4, spotted: 0, pct: 0 },
      { name: 'Bravo', total: 1, spotted: 0, pct: 0 },
      { name: 'Alpha', total: 3, spotted: 1, pct: 33 },
      { name: 'Able', total: 5, spotted: 4, pct: 80 },
      { name: 'Done', total: 2, spotted: 2, pct: 100 },
      { name: 'Closer', total: 5, spotted: 2, pct: 40 },
    ];

    expect(neighborhoods.sort(goalOrientedNeighborhoodSort).map((n) => n.name)).toEqual([
      'Able',
      'Bravo',
      'Alpha',
      'Closer',
      'Done',
      'Zulu',
    ]);
  });

  it('assigns stable labels to the four progress groups', () => {
    expect(statsNeighborhoodGroup({ total: 1, spotted: 0 })).toBe(0);
    expect(statsNeighborhoodGroup({ total: 4, spotted: 1 })).toBe(1);
    expect(statsNeighborhoodGroup({ total: 4, spotted: 4 })).toBe(2);
    expect(statsNeighborhoodGroup({ total: 4, spotted: 0 })).toBe(3);
  });
});
