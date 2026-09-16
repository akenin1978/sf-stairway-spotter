import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  MILESTONE_BADGES,
  SPECIAL_BADGES,
  NEIGHBORHOOD_BADGES,
  countActiveVerifiedStairways,
  isMilestoneEarned,
  milestoneProgressLabel,
  milestoneTier,
  shouldCelebrateMilestone,
} from './badgeDefinitions.js';

const badgesModalSource = readFileSync(
  new URL('./components/BadgesModal.jsx', import.meta.url),
  'utf8'
);

describe('milestoneTier', () => {
  it('assigns bronze below 200', () => {
    expect(milestoneTier(1)).toBe('bronze');
    expect(milestoneTier(25)).toBe('bronze');
    expect(milestoneTier(100)).toBe('bronze');
  });

  it('assigns silver from 200 through 999', () => {
    expect(milestoneTier(200)).toBe('silver');
    expect(milestoneTier(500)).toBe('silver');
    expect(milestoneTier(999)).toBe('silver');
  });

  it('assigns gold at 1000+, and for the all badge', () => {
    expect(milestoneTier(1000)).toBe('gold');
    expect(milestoneTier(1100)).toBe('gold');
    expect(milestoneTier('all')).toBe('gold');
  });
});

describe('isMilestoneEarned', () => {
  it('derives fixed milestones from verified progress, not stale award rows', () => {
    expect(isMilestoneEarned(11, 1, 1267, true)).toBe(true);
    expect(isMilestoneEarned(11, 5, 1267, false)).toBe(true);
    expect(isMilestoneEarned(11, 10, 1267, false)).toBe(true);
    expect(isMilestoneEarned(11, 25, 1267, true)).toBe(false);
  });

  it('keeps the all-stairways badge permanent after it has been earned', () => {
    expect(isMilestoneEarned(1266, 'all', 1267, true)).toBe(true);
    expect(isMilestoneEarned(1266, 'all', 1267, false)).toBe(false);
    expect(isMilestoneEarned(1267, 'all', 1267, false)).toBe(true);
  });

  it('shows the exact milestone set for 153 verified stairways', () => {
    const earnedThresholds = MILESTONE_BADGES
      .filter((badge) =>
        isMilestoneEarned(153, badge.threshold, 1267, false)
      )
      .map((badge) => badge.threshold);

    expect(earnedThresholds).toEqual([1, 5, 10, 25, 50, 100]);
  });

  it('is applied to milestone tiles while neighborhood awards remain permanent', () => {
    const neighborhoodSection = badgesModalSource.slice(
      badgesModalSource.indexOf('sortedNeighborhoodBadges.map'),
      badgesModalSource.indexOf('MILESTONE_BADGES.map')
    );
    const milestoneSection = badgesModalSource.slice(
      badgesModalSource.indexOf('MILESTONE_BADGES.map'),
      badgesModalSource.indexOf('SPECIAL_BADGES.map')
    );

    expect(neighborhoodSection).toContain('earned={earnedBadgeIds.has(badge.id)}');
    expect(neighborhoodSection).not.toContain('earned={isMilestoneEarned(');
    expect(milestoneSection).toContain('earned={isMilestoneEarned(');
  });
});

describe('badge progress counts', () => {
  it('counts unique verified stairways only when they are still active and mapped', () => {
    const activeStairways = [{ id: 'active-1' }, { id: 'active-2' }];
    const verifiedIds = new Set(['active-1', 'retired-stairway']);

    expect(countActiveVerifiedStairways(activeStairways, verifiedIds)).toBe(1);
  });

  it('shows completed milestone counts at their threshold and future progress exactly', () => {
    expect(milestoneProgressLabel(153, 1, 1267)).toBe('1/1');
    expect(milestoneProgressLabel(153, 100, 1267)).toBe('100/100');
    expect(milestoneProgressLabel(153, 200, 1267)).toBe('153/200');
    expect(milestoneProgressLabel(153, 'all', 1267)).toBe('153/1267');
  });
});

describe('badge definitions', () => {
  it('has unique badge ids across all badge categories', () => {
    const ids = [
      ...NEIGHBORHOOD_BADGES.map((badge) => badge.id),
      ...MILESTONE_BADGES.map((badge) => badge.id),
      ...SPECIAL_BADGES.map((badge) => badge.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('preserves critical permanent milestone ids', () => {
    expect(MILESTONE_BADGES.find((b) => b.threshold === 1)?.id).toBe('milestone-1');
    expect(MILESTONE_BADGES.find((b) => b.threshold === 5)?.name).toBe('High Five');
    expect(MILESTONE_BADGES.find((b) => b.threshold === 10)?.name).toBe('Ten Pack');
    expect(MILESTONE_BADGES.find((b) => b.threshold === 1000)?.id).toBe('milestone-1000');
    expect(MILESTONE_BADGES.find((b) => b.threshold === 'all')?.id).toBe('milestone-all');
  });

  it('preserves the special Best of the Best badge id', () => {
    expect(SPECIAL_BADGES[0]?.id).toBe('special-best-of-the-best');
  });
});

describe('shouldCelebrateMilestone', () => {
  it('celebrates only when the current verification reaches the milestone', () => {
    expect(shouldCelebrateMilestone(5, 5, 1200)).toBe(true);
    expect(shouldCelebrateMilestone(10, 10, 1200)).toBe(true);
    expect(shouldCelebrateMilestone(24, 5, 1200)).toBe(false);
    expect(shouldCelebrateMilestone(24, 10, 1200)).toBe(false);
  });

  it('celebrates the all-stairways badge at the current map total', () => {
    expect(shouldCelebrateMilestone(1200, 'all', 1200)).toBe(true);
    expect(shouldCelebrateMilestone(1199, 'all', 1200)).toBe(false);
  });
});
