import { Fragment, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useCheckIns } from '../CheckInsContext';
import {
  goalOrientedNeighborhoodSort,
  statsNeighborhoodGroup,
  STATS_NEIGHBORHOOD_GROUP_LABELS,
} from '../neighborhoodSort';
import useDialogFocus from './useDialogFocus';

// Display-only shortenings for a few long neighborhood names in this
// list -- the underlying data (used for badges and the sheet sync)
// stays exactly as-is. If any of these don't match, it's because the
// actual stored spelling differs slightly (extra word, different
// punctuation) -- worth a quick check against the real data.
const NEIGHBORHOOD_DISPLAY_OVERRIDES = {
  'BART and Muni Stations': 'BART and Muni',
  'Castro/Eureka Valley': 'Castro/Eur. Valley',
  'Forest Hill Extension': 'Forest Hill Ext.',
  'Northern Waterfront': 'No. Waterfront',
  'Presidio (Fort Winfield Scott)': 'Presidio (Ft. Scott)',
};

const STATS_PROGRESS_VIEW_KEY = 'sfss-stats-progress-view';
const STATS_PROGRESS_VIEWS = new Set(['all', 'verified', 'spotted-only']);

function savedProgressView() {
  try {
    const saved = localStorage.getItem(STATS_PROGRESS_VIEW_KEY);
    return STATS_PROGRESS_VIEWS.has(saved) ? saved : 'all';
  } catch {
    return 'all';
  }
}

function weekCount(value) {
  return Number(value || 0);
}

function weekUnit(value) {
  return weekCount(value) === 1 ? 'week' : 'weeks';
}

export default function StatsModal({ onClose }) {
  const dialogRef = useDialogFocus(onClose);
  const { user } = useAuth();
  const { checkedInIds, checkedInMethods, verifiedCount } = useCheckIns();
  const [stairways, setStairways] = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [progressView, setProgressView] = useState(savedProgressView);

  useEffect(() => {
    let cancelled = false;

    // Supabase caps a single select at 1000 rows by default (db-max-rows) --
    // with 1200+ stairways, a plain .select() silently truncates. Page
    // through with .range() until a page comes back short, which means
    // we've reached the end.
    async function fetchAllStairways() {
      const pageSize = 1000;
      let from = 0;
      let all = [];
      while (true) {
        const { data, error } = await supabase
          .from('stairways')
          .select('id, neighborhood')
          .eq('active', true)
          .range(from, from + pageSize - 1);
        if (error || !data) throw error || new Error('Missing stairway data');
        all = all.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return all;
    }

    async function load() {
      setLoading(true);
      setLoadError('');

      try {
        const [stairwayData, streakResult] = await Promise.all([
          fetchAllStairways(),
          supabase.rpc('get_my_streak').maybeSingle(),
        ]);
        if (streakResult.error) throw streakResult.error;

        if (!cancelled) {
          setStairways(stairwayData || []);
          setStreak(streakResult.data || { current_streak: 0, longest_streak: 0 });
        }
      } catch {
        if (!cancelled) setLoadError("We couldn't load your stats. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (user) load();
    return () => {
      cancelled = true;
    };
  }, [loadAttempt, user]);

  const stats = useMemo(() => {
    const totalStairways = stairways.length;
    const totalSpotted = checkedInIds.size;

    const neighborhoodMap = new Map();
    for (const s of stairways) {
      if (!s.neighborhood) continue;
      const entry = neighborhoodMap.get(s.neighborhood) || {
        total: 0,
        spotted: 0,
        verified: 0,
      };
      entry.total += 1;
      if (checkedInIds.has(s.id)) {
        entry.spotted += 1;
        if (checkedInMethods.get(s.id) === 'photo-verified') entry.verified += 1;
      }
      neighborhoodMap.set(s.neighborhood, entry);
    }

    const neighborhoods = Array.from(neighborhoodMap.entries())
      .map(([name, { total, spotted, verified }]) => ({
        name,
        total,
        spotted,
        verified,
        spottedOnly: Math.max(0, spotted - verified),
        pct: total > 0 ? Math.round((spotted / total) * 100) : 0,
      }))
      .sort(goalOrientedNeighborhoodSort);

    return { totalStairways, totalSpotted, neighborhoods };
  }, [stairways, checkedInIds, checkedInMethods]);

  const visibleNeighborhoods = useMemo(() => {
    if (progressView === 'spotted-only') {
      return stats.neighborhoods
        .filter((neighborhood) => neighborhood.spottedOnly > 0)
        .map((neighborhood) => ({
          ...neighborhood,
          progress: neighborhood.spottedOnly,
          progressPct: neighborhood.total > 0
            ? Math.round((neighborhood.spottedOnly / neighborhood.total) * 100)
            : 0,
        }))
        .sort(
          (a, b) =>
            b.spottedOnly - a.spottedOnly || a.name.localeCompare(b.name)
        );
    }

    return stats.neighborhoods
      .map((neighborhood) => {
        const progress = progressView === 'verified'
          ? neighborhood.verified
          : neighborhood.spotted;
        return {
          ...neighborhood,
          progress,
          progressPct: neighborhood.total > 0
            ? Math.round((progress / neighborhood.total) * 100)
            : 0,
          spotted: progress,
          pct: neighborhood.total > 0
            ? Math.round((progress / neighborhood.total) * 100)
            : 0,
        };
      })
      .sort(goalOrientedNeighborhoodSort);
  }, [progressView, stats.neighborhoods]);

  function chooseProgressView(view) {
    setProgressView(view);
    try {
      localStorage.setItem(STATS_PROGRESS_VIEW_KEY, view);
    } catch {
      // The selection still works for this session when storage is unavailable.
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={dialogRef} className="modal-card stats-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="stats-dialog-title" tabIndex={-1}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h2 id="stats-dialog-title">My stats</h2>

        {loading ? (
          <p className="modal-context">Loading&hellip;</p>
        ) : loadError ? (
          <div className="modal-error">
            <p>{loadError}</p>
            <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry</button>
          </div>
        ) : (
          <>
            <div className="stats-streak-row">
              <div className="stats-streak-block">
                <span className="stats-streak-number">
                  {weekCount(streak?.current_streak)}{' '}
                  <span className="stats-streak-unit">{weekUnit(streak?.current_streak)}</span>
                </span>
                <span className="stats-streak-label">current streak</span>
              </div>
              <div className="stats-streak-block">
                <span className="stats-streak-number">
                  {weekCount(streak?.longest_streak)}{' '}
                  <span className="stats-streak-unit">{weekUnit(streak?.longest_streak)}</span>
                </span>
                <span className="stats-streak-label">longest streak</span>
              </div>
            </div>
            <p className="stats-streak-hint">
              A streak counts consecutive weeks with at least one verified check-in.
            </p>

            <div className="stats-summary-row">
              <div className="stats-summary-block stats-summary-block--primary">
                <span className="stats-summary-number">
                  {verifiedCount} / {stats.totalStairways}
                </span>
                <span className="stats-summary-label">stairways verified</span>
              </div>
              <div className="stats-summary-block">
                <span className="stats-summary-number">
                  {stats.totalSpotted} / {stats.totalStairways}
                </span>
                <span className="stats-summary-label">stairways spotted</span>
                <span className="stats-summary-note">
                  includes {verifiedCount} verified
                </span>
              </div>
            </div>

            <p className="stats-progress-view-label">View progress by:</p>
            <div className="stats-progress-switch" aria-label="Neighborhood progress view">
              {[
                ['all', 'All progress'],
                ['verified', 'Verified'],
                ['spotted-only', 'Spotted only'],
              ].map(([view, label]) => (
                <button
                  key={view}
                  type="button"
                  aria-pressed={progressView === view}
                  onClick={() => chooseProgressView(view)}
                >
                  {label}
                </button>
              ))}
            </div>

            {progressView === 'all' && (
              <div className="stats-progress-legend">
                <span><i className="stats-progress-key stats-progress-key--verified" />Verified</span>
                <span><i className="stats-progress-key stats-progress-key--spotted" />Spotted only</span>
              </div>
            )}
            <div className="stats-neighborhood-list">
              {progressView === 'spotted-only' && visibleNeighborhoods.length === 0 ? (
                <p className="stats-neighborhood-empty">
                  No spotted-only stairways yet. Anything you spot without verifying will appear here.
                </p>
              ) : visibleNeighborhoods.map((n, index) => {
                const group = statsNeighborhoodGroup(n);
                const previousGroup = index > 0
                  ? statsNeighborhoodGroup(visibleNeighborhoods[index - 1])
                  : null;
                return (
                <Fragment key={n.name}>
                  {progressView !== 'spotted-only' && group !== previousGroup && (
                    <h4 className="stats-neighborhood-group-heading">
                      {STATS_NEIGHBORHOOD_GROUP_LABELS[group]}
                    </h4>
                  )}
                  <div className="stats-neighborhood-row">
                  <span className="stats-neighborhood-name">{NEIGHBORHOOD_DISPLAY_OVERRIDES[n.name] || n.name}</span>
                  <div className="stats-neighborhood-bar-track">
                    {progressView === 'all' ? (
                      <>
                        <div className="stats-neighborhood-bar-segment stats-neighborhood-bar-segment--verified" style={{ width: `${(n.verified / n.total) * 100}%` }} />
                        <div className="stats-neighborhood-bar-segment stats-neighborhood-bar-segment--spotted" style={{ width: `${(n.spottedOnly / n.total) * 100}%` }} />
                      </>
                    ) : (
                      <div
                        className={`stats-neighborhood-bar-segment stats-neighborhood-bar-segment--${progressView === 'verified' ? 'verified' : 'spotted'}`}
                        style={{ width: `${n.progressPct}%` }}
                      />
                    )}
                  </div>
                  <span className="stats-neighborhood-count">
                    {progressView === 'spotted-only'
                      ? n.spottedOnly
                      : `${n.progress}/${n.total}`}
                  </span>
                  </div>
                </Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
