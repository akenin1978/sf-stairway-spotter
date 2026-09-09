import { useEffect, useState } from 'react';
import { Filter } from 'bad-words';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useCheckIns, storagePathFromPublicUrl } from '../CheckInsContext';
import { LAUNCH_LINKS } from '../launchLinks';
import { confirmLeaderboardSettingChange } from '../leaderboardSettings';
import useDialogFocus from './useDialogFocus';
import { isNativeApp } from '../nativeDevice';
import { signInWithNativeProvider } from '../nativeAuth';
import {
  revokeAppleAuthorization,
  userUsesApple,
} from '../appleTokenRevocation';

const profanityFilter = new Filter();

export default function SettingsModal({ onClose, startWithDelete = false }) {
  const dialogRef = useDialogFocus(onClose);
  const { user, signOut } = useAuth();
  const { checkedInPhotoUrls } = useCheckIns();
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [displayName, setDisplayName] = useState('');
  // What's actually saved right now, so we can tell (a) whether there are
  // unsaved changes worth warning about on close, and (b) fall back to the
  // last-known-good display name if someone edits it into something
  // invalid -- an invalid name shouldn't be able to block saving the
  // leaderboard toggle, since those are two unrelated things.
  const [savedLeaderboardOptIn, setSavedLeaderboardOptIn] = useState(false);
  const [savedDisplayName, setSavedDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('idle'); // idle | deleting | error
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(startWithDelete);
  const [settingsLoadError, setSettingsLoadError] = useState('');
  const [settingsLoadAttempt, setSettingsLoadAttempt] = useState(0);

  // Load the user's current settings when the modal opens. If they've
  // never saved settings before, there's simply no row yet -- that's
  // expected, not an error, and just means "off" / "no display name" by
  // default.
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    setLoading(true);
    setSettingsLoadError('');

    supabase
      .from('user_settings')
      .select('leaderboard_opt_in, display_name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error && data) {
          setLeaderboardOptIn(data.leaderboard_opt_in);
          setDisplayName(data.display_name || '');
          setSavedLeaderboardOptIn(data.leaderboard_opt_in);
          setSavedDisplayName(data.display_name || '');
        }
        if (error) {
          setSettingsLoadError("We couldn't load your settings. Check your connection and try again.");
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [settingsLoadAttempt, user]);

  const hasUnsavedChanges =
    !loading &&
    (leaderboardOptIn !== savedLeaderboardOptIn ||
      displayName.trim() !== savedDisplayName);

  function handleCloseAttempt() {
    if (
      hasUnsavedChanges &&
      !window.confirm('You have unsaved changes. Discard them?')
    ) {
      return;
    }
    onClose();
  }

  function handleLeaderboardOptInChange(nextOptedIn) {
    const accepted = confirmLeaderboardSettingChange({
      currentlyOptedIn: leaderboardOptIn,
      nextOptedIn,
      confirmOptOut: (message) => window.confirm(message),
    });

    if (accepted) setLeaderboardOptIn(nextOptedIn);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;

    setStatus('saving');
    setErrorMsg('');

    const trimmedName = displayName.trim();
    const nameChanged = trimmedName !== savedDisplayName;

    // Usernames are used by Friends even when leaderboard participation is
    // off, so validate any changed non-empty name independently of that
    // privacy setting.
    let nameError = null;
    if (trimmedName && nameChanged) {
      if (trimmedName.length < 3) {
        nameError = 'Display name needs to be at least 3 characters.';
      } else if (profanityFilter.isProfane(trimmedName)) {
        nameError = "That display name isn't allowed. Please choose something else.";
      } else {
        // Case-insensitive check against everyone else's display name.
        // The database also enforces this for real (two people can't end
        // up with the same name even if they both hit save at the same
        // moment) -- this is just for instant, friendly feedback before
        // that.
        const { data: existing, error: lookupError } = await supabase
          .from('user_settings')
          .select('user_id')
          .ilike('display_name', trimmedName)
          .neq('user_id', user.id)
          .maybeSingle();

        if (lookupError) {
          nameError = lookupError.message;
        } else if (existing) {
          nameError = 'That display name is already taken. Try another.';
        }
      }
    }

    // If the name is invalid, don't let that block the leaderboard
    // toggle -- save the toggle with whatever name was already saved
    // before, and tell the person clearly that only the name part didn't
    // go through.
    const nameToSave = nameError ? savedDisplayName : trimmedName;

    const { error } = await supabase.from('user_settings').upsert(
      {
        user_id: user.id,
        leaderboard_opt_in: leaderboardOptIn,
        // Store an empty display name as null, not an empty string, so
        // it's unambiguous that nothing was set.
        display_name: nameToSave || null,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      setStatus('error');
      // The database's own uniqueness rule is the real backstop -- if
      // someone else grabbed the same name in the split second between
      // our check above and this save, this is what catches it.
      if (error.code === '23505') {
        setErrorMsg('That display name is already taken. Try another.');
      } else {
        setErrorMsg(error.message);
      }
      return;
    }

    setSavedLeaderboardOptIn(leaderboardOptIn);
    setSavedDisplayName(nameToSave);

    if (nameError) {
      setStatus('error');
      setErrorMsg(
        `Your leaderboard setting was saved, but your display name wasn't: ${nameError}`
      );
      // Revert the input back to the last-good name so the field isn't
      // left showing an unsaved, invalid value.
      setDisplayName(nameToSave);
    } else {
      setStatus('saved');
    }
  }

  async function performAccountDeletion() {
    if (!user) return;
    setDeleteConfirmationOpen(false);
    setDeleteStatus('deleting');
    setErrorMsg('');

    // Clean up photo files first -- once the account row is gone, we'd
    // have no record of which files were even ours to remove.
    const paths = [...checkedInPhotoUrls.values()]
      .map(storagePathFromPublicUrl)
      .filter(Boolean);
    if (paths.length > 0) {
      const { error: photoDeleteError } = await supabase.storage
        .from('checkin-photos')
        .remove(paths);
      if (photoDeleteError) {
        setDeleteStatus('error');
        setErrorMsg(
          "We couldn't delete your verification photos, so your account was not deleted. Please try again."
        );
        return;
      }
    }

    if (userUsesApple(user)) {
      try {
        await revokeAppleAuthorization();
      } catch (error) {
        // Apple directs apps to fulfill the deletion request even if the
        // credential needed for automatic revocation is unavailable. Log the
        // failure for operational follow-up, but never retain the account.
        console.error('Apple authorization could not be revoked', error);
      }
    }

    const { error } = await supabase.rpc('delete_my_account');

    if (error) {
      setDeleteStatus('error');
      setErrorMsg(
        "We couldn't delete your account. Nothing was deleted. Check your connection and try again, or contact Support if this continues."
      );
      console.error('Account deletion failed', error);
      return;
    }

    try {
      await signOut();
    } catch (error) {
      // Deleting auth.users invalidates the current session server-side. A
      // local sign-out failure must not make a successful deletion look like
      // it failed or keep the Settings dialog open.
      console.warn('Local sign-out after account deletion failed', error);
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleCloseAttempt}>
      <div ref={dialogRef} className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" tabIndex={-1}>
        <button
          className="modal-close"
          onClick={handleCloseAttempt}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="settings-dialog-title">Settings</h2>

        {loading ? (
          <p className="modal-context">Loading…</p>
        ) : settingsLoadError ? (
          <div className="modal-error">
            <p>{settingsLoadError}</p>
            <button type="button" onClick={() => setSettingsLoadAttempt((attempt) => attempt + 1)}>Retry</button>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <label className="settings-toggle-row">
              <span>
                <span className="settings-toggle-label">
                  Show me on the leaderboard
                </span>
                <span className="settings-toggle-hint">
                  Only verified check-ins count toward it.
                </span>
              </span>
              <span className="settings-toggle">
                <input
                  type="checkbox"
                  checked={leaderboardOptIn}
                  onChange={(e) =>
                    handleLeaderboardOptInChange(e.target.checked)
                  }
                />
                <span className="settings-toggle-track" />
              </span>
            </label>

            <div className="settings-field">
              <label htmlFor="display-name">
                Username
                <span className="settings-toggle-hint">
                  {' '}
                  -- required to add friends. It is shown publicly only if you
                  join the leaderboard.
                </span>
              </label>
              <input
                id="display-name"
                type="text"
                placeholder="e.g. StairMaster_Ali"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                minLength={3}
                maxLength={40}
              />
            </div>

            {status === 'error' && (
              <p className="modal-error">{errorMsg}</p>
            )}
            {status === 'saved' && (
              <p className="settings-saved">Saved!</p>
            )}

            <button type="submit" disabled={status === 'saving'}>
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>

            <div className="settings-legal-links" aria-label="Help and legal">
              <a href={LAUNCH_LINKS.support} target="_blank" rel="noreferrer">
                Support
              </a>
              <a href={LAUNCH_LINKS.privacy} target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              <a href={LAUNCH_LINKS.terms} target="_blank" rel="noreferrer">
                Terms of Use
              </a>
              <a
                href={LAUNCH_LINKS.deleteAccount}
                target="_blank"
                rel="noreferrer"
              >
                Account deletion information
              </a>
            </div>

            <div className="settings-danger-zone">
              {deleteStatus === 'error' && (
                <p className="modal-error">{errorMsg}</p>
              )}
              <button
                type="button"
                className="settings-delete-account"
                onClick={() => setDeleteConfirmationOpen(true)}
                disabled={deleteStatus === 'deleting'}
              >
                {deleteStatus === 'deleting'
                  ? 'Deleting…'
                  : 'Delete my account'}
              </button>
            </div>
          </form>
        )}
        {deleteConfirmationOpen && (
          <DeleteIdentityDialog
            user={user}
            onCancel={() => setDeleteConfirmationOpen(false)}
            onConfirmed={performAccountDeletion}
          />
        )}
      </div>
    </div>
  );
}

function DeleteIdentityDialog({ user, onCancel, onConfirmed }) {
  const dialogRef = useDialogFocus(onCancel);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const identityProviders = (user?.identities || []).map(
    (identity) => identity.provider
  );
  const provider = identityProviders.includes('apple')
    ? 'apple'
    : identityProviders.includes('google')
      ? 'google'
      : user?.app_metadata?.provider || identityProviders[0] || 'email';

  async function confirmIdentity(event) {
    event.preventDefault();
    setStatus('checking');
    setError('');

    try {
      if (provider === 'email') {
        const result = await supabase.auth.signInWithPassword({
          email: user.email,
          password,
        });
        if (result.error) throw result.error;
      } else if (isNativeApp() && (provider === 'apple' || provider === 'google')) {
        await signInWithNativeProvider(provider);
      } else {
        setStatus('error');
        setError(
          `Please confirm your identity in the iPhone app using ${provider === 'apple' ? 'Apple' : 'Google'} before deleting your account.`
        );
        return;
      }
      await onConfirmed();
    } catch {
      setStatus('error');
      setError('We could not confirm your identity. Please try again.');
    }
  }

  const providerLabel = provider === 'apple' ? 'Apple' : 'Google';

  return (
    <div className="modal-backdrop safety-modal-backdrop">
      <div
        ref={dialogRef}
        className="modal-card delete-identity-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-identity-title"
        tabIndex={-1}
      >
        <h2 id="delete-identity-title">Confirm your identity</h2>
        <p>
          Account deletion is permanent. Confirm that it’s really you before
          deleting your account, visits, badges, friendships, and leaderboard data.
        </p>
        <form onSubmit={confirmIdentity}>
          {provider === 'email' ? (
            <label className="auth-field-label">
              <span>Current password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                data-dialog-initial-focus
              />
            </label>
          ) : (
            <p>You’ll confirm using {providerLabel}, the way you signed in.</p>
          )}
          {error && <p className="modal-error" role="alert">{error}</p>}
          <div className="verification-safety-actions">
            <button type="button" className="button-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="settings-delete-account" disabled={status === 'checking'}>
              {status === 'checking'
                ? 'Confirming…'
                : provider === 'email'
                  ? 'Confirm and delete'
                  : `Continue with ${providerLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
