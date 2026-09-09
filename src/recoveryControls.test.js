import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

describe('loading recovery and deletion security', () => {
  it('offers retry actions for major loading failures', () => {
    const map = read('./components/StairwayMap.jsx');
    const friends = read('./components/FriendsModal.jsx');
    const leaderboard = read('./components/LeaderboardModal.jsx');
    const stats = read('./components/StatsModal.jsx');
    const badges = read('./components/BadgesModal.jsx');
    const settings = read('./components/SettingsModal.jsx');
    expect(map).toContain('setLoadAttempt((attempt) => attempt + 1)');
    expect(map).toContain('onClick={handleCheckInNearby}>Retry');
    expect(friends).toContain('onClick={refresh}>Retry');
    expect(leaderboard).toContain('onClick={loadLeaderboard}>Retry');
    expect(stats).toContain('setLoadAttempt((attempt) => attempt + 1)');
    expect(badges).toContain('setLoadAttempt((attempt) => attempt + 1)');
    expect(settings).toContain('setSettingsLoadAttempt((attempt) => attempt + 1)');
  });

  it('requires fresh identity confirmation before account deletion', () => {
    const settings = read('./components/SettingsModal.jsx');
    expect(settings).toContain('Confirm your identity');
    expect(settings).toContain('signInWithPassword');
    expect(settings).toContain('signInWithNativeProvider(provider)');
    expect(settings).toContain('await onConfirmed()');
  });
});
