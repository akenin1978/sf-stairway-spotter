import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('leaderboard explanation', () => {
  it('explains that rank uses unique stairways rather than repeat visits', () => {
    const source = fs.readFileSync(
      new URL('./components/LeaderboardModal.jsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('Ranked by unique verified stairways.');
    expect(source).toContain(
      'Repeat visits count toward\n          mayorships, but not leaderboard rank.'
    );
    expect(source).toContain('Unique verified');
  });
});
