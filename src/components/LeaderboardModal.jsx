import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import ReportUserModal, { UserSafetyMenu } from './ReportUserModal';
import useDialogFocus from './useDialogFocus';

const NEIGHBOR_WINDOW = 10; // how many ranks above/below the user to show

function LeaderboardRow({ rank, entry, isMe, isFriend, onReport, onBlock }) {
  return (
    <div className={'leaderboard-row' + (isMe ? ' leaderboard-row-me' : '')}>
      <span className="leaderboard-rank">#{rank}</span>
      <span className="leaderboard-name">
        {isMe ? (
          <span className="leaderboard-name-text">
            {entry.display_name}
            <span className="leaderboard-you-tag"> (you)</span>
          </span>
        ) : (
          <UserSafetyMenu
            person={entry}
            onReport={onReport}
            onBlock={onBlock}
            triggerClassName="leaderboard-name-button"
            triggerContent={
              <>
                {isFriend && <span className="leaderboard-friend-icon">★</span>}
                {entry.display_name}
              </>
            }
          />
        )}
      </span>
      <span className="leaderboard-count">{entry.verified_count}</span>
    </div>
  );
}

function LeaderboardHeader() {
  return (
    <div className="leaderboard-header" aria-hidden="true">
      <span>Rank</span>
      <span>Spotter</span>
      <span className="leaderboard-header-verified">Unique verified</span>
    </div>
  );
}

export default function LeaderboardModal({ onClose }) {
  const dialogRef = useDialogFocus(onClose);
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [friendIds, setFriendIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportingUser, setReportingUser] = useState(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [leaderboardRes, friendsRes, hiddenRes] = await Promise.all([
      supabase.rpc('get_leaderboard'),
      supabase.rpc('get_my_friends'),
      supabase.rpc('get_hidden_user_ids'),
    ]);
    if (leaderboardRes.error || friendsRes.error || hiddenRes.error) {
      setError("We couldn't load the leaderboard. Check your connection and try again.");
      setLoading(false);
      return;
    }
    const hiddenIds = new Set((hiddenRes.data || []).map((row) => row.user_id));
    setEntries((leaderboardRes.data || []).filter((entry) => !hiddenIds.has(entry.user_id)));
    setFriendIds(
      new Set(
        (friendsRes.data || [])
          .filter((f) => f.status === 'accepted')
          .map((f) => f.friend_user_id)
      )
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  async function handleBlock(person) {
    if (!window.confirm(`Block ${person.display_name}? You won't see each other on the leaderboard or be able to send friend requests.`)) return;
    const { error: blockError } = await supabase.rpc('block_user', {
      p_target_user_id: person.user_id,
    });
    if (blockError) {
      setError("We couldn't block this user. Please try again.");
      return;
    }
    setEntries((current) => current.filter((entry) => entry.user_id !== person.user_id));
    setFriendIds((current) => {
      const next = new Set(current);
      next.delete(person.user_id);
      return next;
    });
  }

  const myIndex = entries.findIndex((e) => e.user_id === user?.id);
  const topTen = entries.slice(0, 10);

  const neighborStart =
    myIndex > 9 ? Math.max(10, myIndex - NEIGHBOR_WINDOW) : null;
  const neighbors =
    neighborStart !== null
      ? entries.slice(neighborStart, myIndex + NEIGHBOR_WINDOW + 1)
      : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-card leaderboard-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leaderboard-dialog-title"
        tabIndex={-1}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 id="leaderboard-dialog-title">Leaderboard</h2>
        <p className="modal-context">
          Ranked by unique verified stairways. Repeat visits count toward
          mayorships, but not leaderboard rank.{' '}
          <span className="leaderboard-friend-icon">★</span> marks a friend.
        </p>

        {loading && <p className="modal-context">Loading…</p>}
        {error && (
          <div className="modal-error">
            <p>{error}</p>
            <button type="button" onClick={loadLeaderboard}>Retry</button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="modal-context">
            No one's opted in yet -- be the first! You can turn this on in
            Settings.
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <h3 className="leaderboard-section-heading">Top 10</h3>
            <LeaderboardHeader />
            <div className="leaderboard-list">
              {topTen.map((entry, i) => (
                <LeaderboardRow
                  key={entry.user_id}
                  rank={i + 1}
                  entry={entry}
                  isMe={entry.user_id === user?.id}
                  isFriend={friendIds.has(entry.user_id)}
                  onReport={setReportingUser}
                  onBlock={handleBlock}
                />
              ))}
            </div>

            {neighborStart !== null && (
              <>
                <h3 className="leaderboard-section-heading">
                  Around you · #{neighborStart + 1}–#{neighborStart + neighbors.length}
                </h3>
                <LeaderboardHeader />
                <div className="leaderboard-list">
                  {neighbors.map((entry, i) => (
                    <LeaderboardRow
                      key={entry.user_id}
                      rank={neighborStart + i + 1}
                      entry={entry}
                      isMe={entry.user_id === user?.id}
                      isFriend={friendIds.has(entry.user_id)}
                      onReport={setReportingUser}
                      onBlock={handleBlock}
                    />
                  ))}
                </div>
              </>
            )}

            {myIndex === -1 && (
              <p className="modal-context">
                You're not on the board yet -- opt in from Settings to see
                your ranking here.
              </p>
            )}
          </>
        )}
      </div>
      {reportingUser && (
        <ReportUserModal
          userToReport={reportingUser}
          context="leaderboard"
          onClose={() => setReportingUser(null)}
        />
      )}
    </div>
  );
}
