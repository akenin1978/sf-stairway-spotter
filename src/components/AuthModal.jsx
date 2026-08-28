import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { isAndroidApp, isNativeApp } from '../nativeDevice';
import {
  isNativeGoogleConfigured,
  signInWithNativeProvider,
} from '../nativeAuth';

export default function AuthModal({ onClose }) {
  const nativeApp = isNativeApp();
  const androidApp = isAndroidApp();
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    if (mode === 'sign-up') {
      // Depending on your Supabase Auth settings, new accounts may need to
      // confirm their email before they can sign in -- show a clear next
      // step either way rather than assuming.
      setStatus('success');
    } else {
      onClose();
    }
  }

  async function handleGoogleSignIn() {
    setStatus('submitting');
    setErrorMsg('');
    if (nativeApp) {
      try {
        await signInWithNativeProvider('google');
        onClose();
      } catch (error) {
        if (error?.code === 'USER_CANCELLED') {
          setStatus('idle');
          return;
        }
        setStatus('error');
        setErrorMsg(
          error?.message === 'google-native-not-configured'
            ? 'Google sign-in needs its iPhone client ID configured first.'
            : 'Google sign-in could not be completed. Please try again.'
        );
      }
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    // On success, the browser navigates away to Google immediately, so
    // there's nothing further to do here. We only reach this point if the
    // request itself failed to even start.
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    }
  }

  async function handleAppleSignIn() {
    setStatus('submitting');
    setErrorMsg('');
    try {
      await signInWithNativeProvider('apple');
      onClose();
    } catch (error) {
      if (error?.code === 'USER_CANCELLED') {
        setStatus('idle');
        return;
      }
      setStatus('error');
      setErrorMsg(
        'Apple sign-in could not be completed. Confirm Sign in with Apple is enabled for this app.'
      );
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {status === 'success' && mode === 'sign-up' ? (
          <div>
            <h2>Check your email</h2>
            <p>
              We sent a confirmation link to <strong>{email}</strong>. Click
              it to finish creating your account, then come back and sign in.
            </p>
          </div>
        ) : (
          <>
            <h2>{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</h2>

            {nativeApp && !androidApp && (
              <button
                type="button"
                className="apple-signin-button"
                onClick={handleAppleSignIn}
                disabled={status === 'submitting'}
              >
                <AppleIcon />
                Continue with Apple
              </button>
            )}

            <button
              type="button"
              className="google-signin-button"
              onClick={handleGoogleSignIn}
              disabled={
                status === 'submitting' ||
                (nativeApp && !isNativeGoogleConfigured())
              }
            >
              <GoogleIcon />
              {nativeApp && !isNativeGoogleConfigured()
                ? 'Google sign-in setup required'
                : 'Continue with Google'}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === 'sign-in' ? 'current-password' : 'new-password'
                }
                minLength={6}
                required
              />

              {status === 'error' && (
                <p className="modal-error">{errorMsg}</p>
              )}

              <button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting'
                  ? 'Please wait…'
                  : mode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              {mode === 'sign-in' ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMode('sign-up');
                      setStatus('idle');
                      setErrorMsg('');
                    }}
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setMode('sign-in');
                      setStatus('idle');
                      setErrorMsg('');
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.05 12.54c-.03-3.18 2.6-4.73 2.72-4.8a5.85 5.85 0 0 0-4.61-2.5c-1.94-.2-3.82 1.16-4.81 1.16-1.01 0-2.54-1.14-4.19-1.1a6.1 6.1 0 0 0-5.13 3.13c-2.23 3.86-.57 9.54 1.57 12.66 1.07 1.53 2.31 3.24 3.96 3.18 1.62-.07 2.22-1.02 4.18-1.02 1.93 0 2.5 1.02 4.2.98 1.73-.03 2.82-1.53 3.85-3.07a12.6 12.6 0 0 0 1.76-3.58 5.5 5.5 0 0 1-3.5-5.04ZM13.9 3.18A5.57 5.57 0 0 0 15.18-.8a5.65 5.65 0 0 0-3.66 1.9 5.3 5.3 0 0 0-1.31 3.83 4.67 4.67 0 0 0 3.69-1.75Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}
