import { useState } from 'react';
import { LAUNCH_LINKS } from '../launchLinks';
import { supabase } from '../supabaseClient';

export const VERIFICATION_SAFETY_TERMS_VERSION = '2026-09-09';

export function hasAcceptedVerificationSafety(user, acceptedVersion = null) {
  return (
    acceptedVersion === VERIFICATION_SAFETY_TERMS_VERSION ||
    user?.user_metadata?.verification_safety_terms_version ===
      VERIFICATION_SAFETY_TERMS_VERSION
  );
}

export default function VerificationSafetyDialog({ onCancel, onAccepted }) {
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState('idle');

  async function acceptAndContinue() {
    if (!confirmed || status === 'saving') return;
    setStatus('saving');
    const { error } = await supabase.auth.updateUser({
      data: {
        verification_safety_terms_version: VERIFICATION_SAFETY_TERMS_VERSION,
        verification_safety_accepted_at: new Date().toISOString(),
      },
    });
    if (error) {
      setStatus('error');
      return;
    }
    onAccepted(VERIFICATION_SAFETY_TERMS_VERSION);
  }

  return (
    <div className="modal-backdrop safety-modal-backdrop">
      <div
        className="modal-card verification-safety-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-safety-title"
      >
        <h2 id="verification-safety-title">Explore safely</h2>
        <p>
          Stairway conditions, access, traffic, lighting, and closures can
          change without notice. Stay aware, obey signs and traffic laws, and
          use your own judgment about whether a stairway is appropriate for
          you.
        </p>
        <p>
          Stop in a safe place before using the app. Do not interact with it
          while walking, climbing stairs, driving, cycling, or crossing a
          street.
        </p>
        <label className="verification-safety-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>
            I understand these risks and agree to the{' '}
            <a href={LAUNCH_LINKS.terms} target="_blank" rel="noreferrer">
              Terms of Use
            </a>
            .
          </span>
        </label>
        {status === 'error' && (
          <p className="modal-error">
            We couldn’t save your acknowledgment. Check your connection and
            try again.
          </p>
        )}
        <div className="verification-safety-actions">
          <button type="button" className="button-secondary" onClick={onCancel}>
            Not now
          </button>
          <button
            type="button"
            onClick={acceptAndContinue}
            disabled={!confirmed || status === 'saving'}
          >
            {status === 'saving' ? 'Saving…' : 'I understand — continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
