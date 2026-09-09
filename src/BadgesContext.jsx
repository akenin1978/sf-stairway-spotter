import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import {
  NEIGHBORHOOD_BADGES,
  MILESTONE_BADGES,
  SPECIAL_BADGES,
  milestoneTier,
  shouldCelebrateMilestone,
} from './badgeDefinitions';
import { fetchVerifiedStairwayIds } from './verifiedBadgeProgress';

const BadgesContext = createContext(null);

const BEST_OF_THE_BEST_ID = 'special-best-of-the-best';

export function BadgesProvider({ children }) {
  const { user } = useAuth();
  const [earnedBadgeIds, setEarnedBadgeIds] = useState(new Set());
  const [earnedBadgeDates, setEarnedBadgeDates] = useState(new Map());
  const [verifiedIds, setVerifiedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setEarnedBadgeIds(new Set());
      setEarnedBadgeDates(new Map());
      setVerifiedIds(new Set());
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.all([
      supabase
        .from('badges_earned')
        .select('badge_id, earned_at')
        .eq('user_id', user.id),
      fetchVerifiedStairwayIds(supabase, user.id),
    ]).then(([badgeResult, verifiedResult]) => {
        if (!isMounted) return;
        if (!badgeResult.error && badgeResult.data) {
          setEarnedBadgeIds(new Set(badgeResult.data.map((row) => row.badge_id)));
          setEarnedBadgeDates(
            new Map(badgeResult.data.map((row) => [row.badge_id, row.earned_at]))
          );
        }
        if (!verifiedResult.error && verifiedResult.data) {
          setVerifiedIds(verifiedResult.data);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Writes one newly-earned badge, both to the database and to local
  // state. Uses upsert with ignoreDuplicates as a safety net -- if this
  // somehow gets called twice for the same badge (e.g. two check-ins in
  // quick succession), it silently no-ops the second time rather than
  // erroring or creating a duplicate row.
  const awardBadge = useCallback(
    async (badgeId) => {
      if (!user) return;

      const { error } = await supabase.from('badges_earned').upsert(
        { user_id: user.id, badge_id: badgeId },
        { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
      );

      if (!error) {
        setEarnedBadgeIds((prev) => new Set(prev).add(badgeId));
        setEarnedBadgeDates((prev) =>
          new Map(prev).set(badgeId, new Date().toISOString())
        );
      } else {
        // This used to fail completely silently -- no error shown
        // anywhere, which made a real bug here indistinguishable from
        // "just hasn't been triggered yet." Logging it so a genuine
        // failure is actually visible in the console going forward.
        console.error('Failed to award badge', badgeId, error);
      }
    },
    [user]
  );

  // The core awarding check. Runs only after an in-person photo verification
  // succeeds. Self-reported Spotted entries remain a private checklist and do
  // not earn badges. Previously earned badge records are deliberately left
  // untouched; this rule applies prospectively to new awards. Deliberately
  // scoped to just what's relevant to the ONE stairway just verified,
  // rather than re-scanning all badges on every verification:
  //   - that stairway's neighborhood (did this just complete it?)
  //   - the new running total (did this just cross a milestone?)
  //   - Best of the Best, only if the stairway just spotted was a 5
  //
  // `stairways` is the full list already loaded by the map (with
  // neighborhood/rating on each). The private verified_visits history is the
  // source of truth, including visits that predate this prospective rule.
  const checkAndAwardBadges = useCallback(
    async (stairways, verifiedStairwayId) => {
      const newlyAwarded = [];
      if (!user || !stairways || stairways.length === 0) return newlyAwarded;

      const verifiedResult = await fetchVerifiedStairwayIds(supabase, user.id);
      if (verifiedResult.error) {
        console.error('Failed to load verified badge progress', verifiedResult.error);
        return newlyAwarded;
      }
      const verifiedIds = verifiedResult.data;
      setVerifiedIds(new Set(verifiedIds));

      const verifiedStairway = stairways.find(
        (s) => s.id === verifiedStairwayId
      );
      if (!verifiedStairway) return newlyAwarded;

      // --- Neighborhood completion ---
      const neighborhoodBadge = NEIGHBORHOOD_BADGES.find(
        (b) => b.neighborhood === verifiedStairway.neighborhood
      );
      if (neighborhoodBadge && !earnedBadgeIds.has(neighborhoodBadge.id)) {
        const stairwaysInNeighborhood = stairways.filter(
          (s) => s.neighborhood === verifiedStairway.neighborhood
        );
        const allVerified = stairwaysInNeighborhood.every((s) =>
          verifiedIds.has(s.id)
        );
        if (allVerified) {
          await awardBadge(neighborhoodBadge.id);
          newlyAwarded.push({
            id: neighborhoodBadge.id,
            name: neighborhoodBadge.name,
            neighborhood: neighborhoodBadge.neighborhood,
            tier: 'neighborhood',
          });
        }
      }

      // --- Milestones ---
      const totalVerified = verifiedIds.size;
      const totalStairways = stairways.length;
      for (const milestone of MILESTONE_BADGES) {
        if (earnedBadgeIds.has(milestone.id)) continue;
        const threshold =
          milestone.threshold === 'all' ? totalStairways : milestone.threshold;
        if (totalVerified >= threshold) {
          await awardBadge(milestone.id);
          // Backfill newly introduced milestones silently for testers who have
          // already passed them. The celebration is only useful at the moment
          // the verified total actually reaches that milestone.
          if (
            shouldCelebrateMilestone(
              totalVerified,
              milestone.threshold,
              totalStairways
            )
          ) {
            newlyAwarded.push({
              id: milestone.id,
              name: milestone.name,
              tier: milestoneTier(milestone.threshold),
            });
          }
        }
      }

      // --- Best of the Best ---
      if (
        verifiedStairway.rating === 5 &&
        !earnedBadgeIds.has(BEST_OF_THE_BEST_ID)
      ) {
        const fiveStarStairways = stairways.filter((s) => s.rating === 5);
        const allFiveStarVerified = fiveStarStairways.every((s) =>
          verifiedIds.has(s.id)
        );
        if (allFiveStarVerified) {
          await awardBadge(BEST_OF_THE_BEST_ID);
          const bestBadge = SPECIAL_BADGES.find((b) => b.id === BEST_OF_THE_BEST_ID);
          newlyAwarded.push({
            id: BEST_OF_THE_BEST_ID,
            name: bestBadge ? bestBadge.name : 'Best of the Best',
            tier: 'special',
          });
        }
      }

      return newlyAwarded;
    },
    [user, earnedBadgeIds, awardBadge]
  );

  const value = {
    earnedBadgeIds,
    earnedBadgeDates,
    verifiedIds,
    loading,
    checkAndAwardBadges,
  };

  return (
    <BadgesContext.Provider value={value}>{children}</BadgesContext.Provider>
  );
}

export function useBadges() {
  const ctx = useContext(BadgesContext);
  if (!ctx) {
    throw new Error('useBadges must be used within a BadgesProvider');
  }
  return ctx;
}
