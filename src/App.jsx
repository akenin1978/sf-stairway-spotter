import { useCallback, useEffect, useState } from 'react';
import StairwayMap from './components/StairwayMap';
import OnboardingCarousel from './components/OnboardingCarousel';
import FeedbackModal from './components/FeedbackModal';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import BadgesModal from './components/BadgesModal';
import StatsModal from './components/StatsModal';
import LeaderboardModal from './components/LeaderboardModal';
import FriendsModal from './components/FriendsModal';
import LaunchAnimation from './components/LaunchAnimation';
import InAppPublicPage from './components/InAppPublicPage';
import { useAuth } from './AuthContext';
import { useCheckIns } from './CheckInsContext';
import { supabase } from './supabaseClient';
import { LAUNCH_LINKS } from './launchLinks';
import {
  friendRequestNotice,
  seenFriendRequestStorageKey,
  unseenFriendRequests,
} from './friendRequests';
import useDialogFocus from './components/useDialogFocus';
import { markBadgeStairwayViewed } from './badgeStairwayViews';

export default function App() {
  const [showLaunchAnimation, setShowLaunchAnimation] = useState(true);
  const dismissLaunchAnimation = useCallback(() => setShowLaunchAnimation(false), []);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackStairway, setFeedbackStairway] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsStartWithDelete, setSettingsStartWithDelete] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [publicPageOpen, setPublicPageOpen] = useState(null);
  const [spotMode, setSpotMode] = useState(false);
  const [spottedListOpen, setSpottedListOpen] = useState(false);
  const [badgeStairwayRequest, setBadgeStairwayRequest] = useState(null);
  const { user, loading, signOut, passwordRecovery, finishPasswordRecovery } = useAuth();
  const {
    count: checkedInCount,
    verifiedCount,
    ready: accountProgressReady,
  } = useCheckIns();
  const [totalStairways, setTotalStairways] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [friendRequestAlert, setFriendRequestAlert] = useState(null);
  const friendRequestDialogRef = useDialogFocus(
    () => dismissFriendRequestAlert(),
    { active: Boolean(friendRequestAlert && !showOnboarding && !showLaunchAnimation) }
  );

  useEffect(() => {
    supabase
      .from('stairways')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .then(({ count }) => {
        if (count != null) setTotalStairways(count);
      });
  }, []);

  // Shown once on the first launch of this installation/device, regardless
  // of whether an account session already exists. Dismissing (Skip,
  // "Get started", or swiping past the last slide) sets a permanent local
  // flag, so logging in or out never makes the slides appear again.
  useEffect(() => {
    if (!loading) {
      const seen = localStorage.getItem('sf_stairway_onboarding_seen') === 'true';
      if (!seen) setShowOnboarding(true);
    }
  }, [loading]);

  useEffect(() => {
    if (passwordRecovery) setAuthOpen(true);
  }, [passwordRecovery]);

  useEffect(() => {
    if (!user) {
      setFriendRequestAlert(null);
      return;
    }

    let isMounted = true;
    const storageKey = seenFriendRequestStorageKey(user.id);
    let seenIds = [];
    try {
      seenIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      seenIds = [];
    }

    supabase.rpc('get_my_friends').then(({ data, error }) => {
      if (!isMounted || error) return;
      const unseen = unseenFriendRequests(data || [], seenIds);
      if (unseen.length > 0) {
        setFriendRequestAlert({ requests: unseen, storageKey, seenIds });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  function dismissFriendRequestAlert({ openFriends = false } = {}) {
    if (!friendRequestAlert) return;
    const requestIds = friendRequestAlert.requests.map(
      (request) => request.friendship_id
    );
    localStorage.setItem(
      friendRequestAlert.storageKey,
      JSON.stringify([...new Set([...friendRequestAlert.seenIds, ...requestIds])])
    );
    setFriendRequestAlert(null);
    if (openFriends) setFriendsOpen(true);
  }

  function dismissOnboarding() {
    localStorage.setItem('sf_stairway_onboarding_seen', 'true');
    setShowOnboarding(false);
  }

  const openGeneralFeedback = () => {
    setFeedbackStairway(null);
    setFeedbackOpen(true);
  };

  const openStairwayFeedback = (stairway) => {
    setFeedbackStairway(stairway);
    setFeedbackOpen(true);
  };

  return (
    <div className="app">
      {showLaunchAnimation && (
        <LaunchAnimation onComplete={dismissLaunchAnimation} />
      )}

      {showOnboarding && (
        <OnboardingCarousel
          totalStairways={totalStairways}
          onDismiss={dismissOnboarding}
        />
      )}

      <header className="app-header">
        <h1>
          <svg
            className="app-header-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect x="1" y="17" width="5" height="6" fill="#ffffff" />
            <rect x="7" y="12" width="5" height="11" fill="#ffffff" />
            <rect x="13" y="7" width="5" height="16" fill="#ffffff" />
            <rect x="19" y="2" width="4" height="21" fill="#ffffff" />
          </svg>
          SF Stairway Spotter
        </h1>

        <div className="header-menu-wrapper">
          <button
            className="header-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            Menu
          </button>

          {menuOpen && (
            <>
              <div
                className="header-menu-backdrop"
                onClick={() => setMenuOpen(false)}
              />
              <div className="header-menu-panel">
                {!loading &&
                  (user ? (
                    <>
                      <div className="header-menu-email">{user.email}</div>
                      <button
                        className="header-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          setBadgesOpen(true);
                        }}
                      >
                        Badges
                      </button>
                      <button
                        className="header-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          setStatsOpen(true);
                        }}
                      >
                        My stats
                      </button>
                      <button
                        className="header-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          setLeaderboardOpen(true);
                        }}
                      >
                        Leaderboard
                      </button>
                      <button
                        className="header-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          setFriendsOpen(true);
                        }}
                      >
                        Friends
                      </button>
                      <button
                        className="header-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          setSettingsStartWithDelete(false);
                          setSettingsOpen(true);
                        }}
                      >
                        Settings
                      </button>
                      <button
                        className="header-menu-item"
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                        }}
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <button
                      className="header-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        setAuthOpen(true);
                      }}
                    >
                      Sign in
                    </button>
                  ))}
                <div className="header-menu-divider" />
                <button
                  className="header-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowOnboarding(true);
                  }}
                >
                  How it works
                </button>
                <button
                  className="header-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    openGeneralFeedback();
                  }}
                >
                  Feedback
                </button>
                <button
                  className="header-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setPublicPageOpen('support');
                  }}
                >
                  Support
                </button>
                <button
                  className="header-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setPublicPageOpen('privacy');
                  }}
                >
                  Privacy Policy
                </button>
                <button
                  className="header-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setPublicPageOpen('terms');
                  }}
                >
                  Terms of Use
                </button>
                {user ? (
                  <button
                    className="header-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      setSettingsStartWithDelete(true);
                      setSettingsOpen(true);
                    }}
                  >
                    Delete my account
                  </button>
                ) : (
                  <a
                    className="header-menu-item"
                    href={LAUNCH_LINKS.deleteAccount}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMenuOpen(false)}
                  >
                    Account deletion information
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {user && (
          <button
            className="header-progress"
            onClick={() => setSpottedListOpen(true)}
            disabled={!accountProgressReady}
          >
            {accountProgressReady ? (
              <>
                {checkedInCount} / {totalStairways ?? '…'} spotted
                {verifiedCount > 0 ? ` (${verifiedCount} verified)` : ''}
              </>
            ) : (
              'Loading your progress…'
            )}
          </button>
        )}
      </header>

      <StairwayMap
        onReportIssue={openStairwayFeedback}
        onRequireSignIn={() => setAuthOpen(true)}
        spotMode={spotMode}
        onStartSpot={() => setSpotMode(true)}
        onCancelSpot={() => setSpotMode(false)}
        spottedListOpen={spottedListOpen}
        onCloseSpottedList={() => setSpottedListOpen(false)}
        badgeStairwayRequest={badgeStairwayRequest}
        onBadgeStairwayViewed={(stairwayId) =>
          markBadgeStairwayViewed(user?.id, stairwayId)
        }
      />

      {publicPageOpen && (
        <InAppPublicPage
          page={publicPageOpen}
          onClose={() => setPublicPageOpen(null)}
        />
      )}

      {feedbackOpen && (
        <FeedbackModal
          stairway={feedbackStairway}
          onClose={() => setFeedbackOpen(false)}
        />
      )}

      {authOpen && (
        <AuthModal
          passwordRecovery={passwordRecovery}
          onPasswordRecoveryFinished={finishPasswordRecovery}
          onClose={() => setAuthOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          startWithDelete={settingsStartWithDelete}
          onOpenPublicPage={(page) => {
            setSettingsOpen(false);
            setSettingsStartWithDelete(false);
            setPublicPageOpen(page);
          }}
          onClose={() => {
            setSettingsOpen(false);
            setSettingsStartWithDelete(false);
          }}
        />
      )}

      {badgesOpen && (
        <BadgesModal
          onClose={() => setBadgesOpen(false)}
          onShowStairways={(stairways) => {
            setBadgesOpen(false);
            setBadgeStairwayRequest({
              ids: stairways.map((stairway) => stairway.id),
              requestedAt: Date.now(),
            });
          }}
        />
      )}

      {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} />}

      {leaderboardOpen && (
        <LeaderboardModal onClose={() => setLeaderboardOpen(false)} />
      )}

      {friendsOpen && (
        <FriendsModal
          onClose={() => setFriendsOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {friendRequestAlert && !showOnboarding && !showLaunchAnimation && (
        <div className="modal-backdrop">
          <div ref={friendRequestDialogRef} className="modal-card friend-request-alert" role="dialog" aria-modal="true" aria-labelledby="friend-request-title" tabIndex={-1}>
            <h2 id="friend-request-title">New friend request</h2>
            <p>{friendRequestNotice(friendRequestAlert.requests)}</p>
            {friendRequestAlert.requests.length > 1 && (
              <ul>
                {friendRequestAlert.requests.map((request) => (
                  <li key={request.friendship_id}>
                    {request.friend_display_name || 'A stairway spotter'}
                  </li>
                ))}
              </ul>
            )}
            <div className="friend-request-alert-actions">
              <button onClick={() => dismissFriendRequestAlert()}>
                Later
              </button>
              <button onClick={() => dismissFriendRequestAlert({ openFriends: true })}>
                View request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
