import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useCheckIns } from '../CheckInsContext';
import { LAUNCH_LINKS } from '../launchLinks';
import { friendlyAuthError } from '../authErrors';
import { isAndroidApp, isNativeApp } from '../nativeDevice';
import {
  isNativeGoogleConfigured,
  signInWithNativeProvider,
} from '../nativeAuth';

export default function AuthModal({
  onClose,
  passwordRecovery = false,
  onPasswordRecoveryFinished = () => {},
}) {
  const nativeApp = isNativeApp();
  const androidApp = isAndroidApp();
  const { user } = useAuth();
  const { ready: accountProgressReady } = useCheckIns();
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // idle | submitting | loading-progress | success | error
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const awaitingProgress = status === 'loading-progress';
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendStatus, setResendStatus] = useState('idle');
  const [resendError, setResendError] = useState('');
  const [authErrorCode, setAuthErrorCode] = useState('');

  useEffect(() => {
    if (awaitingProgress && user && accountProgressReady) onClose();
  }, [accountProgressReady, awaitingProgress, onClose, user]);

  function waitForAccountProgress() {
    setStatus('loading-progress');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    setAuthErrorCode('');

    if (mode === 'sign-up' && password !== confirmPassword) {
      setStatus('error');
      setErrorMsg('Passwords do not match. Please try again.');
      return;
    }

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setStatus('error');
      setAuthErrorCode(error.code || '');
      setErrorMsg(
        friendlyAuthError(error, mode === 'sign-in' ? 'sign-in' : 'sign-up')
      );
      return;
    }

    if (mode === 'sign-up') {
      // Depending on your Supabase Auth settings, new accounts may need to
      // confirm their email before they can sign in -- show a clear next
      // step either way rather than assuming.
      setStatus('success');
    } else {
      waitForAccountProgress();
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: LAUNCH_LINKS.passwordReset,
    });
    if (error) {
      setStatus('error');
      setErrorMsg(friendlyAuthError(error, 'reset-email'));
      return;
    }
    setStatus('success');
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMsg('Passwords do not match. Please try again.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus('error');
      setErrorMsg(friendlyAuthError(error, 'update-password'));
      return;
    }
    setResetComplete(true);
    setStatus('success');
    onPasswordRecoveryFinished();
  }

  async function handleResendConfirmation() {
    setResendStatus('sending');
    setResendError('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      setResendStatus('error');
      setResendError(friendlyAuthError(error, 'confirmation-email'));
      return;
    }
    setResendStatus('sent');
  }

  async function handleGoogleSignIn() {
    setStatus('submitting');
    setErrorMsg('');
    if (nativeApp) {
      try {
        await signInWithNativeProvider('google');
        waitForAccountProgress();
      } catch (error) {
        if (error?.code === 'USER_CANCELLED') {
          setStatus('idle');
          return;
        }
        setStatus('error');
        setErrorMsg(
          error?.message === 'google-native-not-configured'
            ? 'Google sign-in is temporarily unavailable. Please use another method or try again later.'
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
      setErrorMsg(friendlyAuthError(error, 'google-sign-in'));
    }
  }

  async function handleAppleSignIn() {
    setStatus('submitting');
    setErrorMsg('');
    try {
      await signInWithNativeProvider('apple');
      waitForAccountProgress();
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
    <div
      className="modal-backdrop"
      onClick={awaitingProgress ? undefined : onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {!awaitingProgress && (
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}

        {passwordRecovery ? (
          resetComplete ? (
            <div>
              <h2>Password updated</h2>
              <p>Your new password is ready to use.</p>
              <button type="button" onClick={onClose}>Done</button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset}>
              <h2>Choose a new password</h2>
              <PasswordField
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <PasswordField
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              {status === 'error' && (
                <p className="modal-error" role="alert">{errorMsg}</p>
              )}
              <button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Please wait…' : 'Update password'}
              </button>
            </form>
          )
        ) : forgotPassword ? (
          status === 'success' ? (
            <div>
              <h2>Check your email</h2>
              <p>
                If an account exists for <strong>{email}</strong>, we sent a
                link to reset its password.
              </p>
              <button type="button" onClick={onClose}>Done</button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <h2>Reset your password</h2>
              <p>Enter your email address and we’ll send you a reset link.</p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              {status === 'error' && (
                <p className="modal-error" role="alert">{errorMsg}</p>
              )}
              <button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Please wait…' : 'Send reset link'}
              </button>
              <p className="auth-switch">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setForgotPassword(false);
                    setStatus('idle');
                    setErrorMsg('');
                  }}
                >
                  Back to sign in
                </button>
              </p>
            </form>
          )
        ) : awaitingProgress ? (
          <div className="auth-progress-loading" role="status" aria-live="polite">
            <h2>Loading your progress…</h2>
            <p>Getting your spotted and verified stairways ready.</p>
          </div>
        ) : status === 'success' && mode === 'sign-up' ? (
          <div>
            <h2>Check your email</h2>
            <p>
              We sent a confirmation link to <strong>{email}</strong>. Click
              it to finish creating your account, then come back and sign in.
            </p>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendStatus === 'sending'}
            >
              {resendStatus === 'sending'
                ? 'Sending…'
                : 'Resend confirmation email'}
            </button>
            {resendStatus === 'sent' && (
              <p className="modal-success" role="status">
                A new confirmation email has been sent.
              </p>
            )}
            {resendStatus === 'error' && (
              <p className="modal-error" role="alert">{resendError}</p>
            )}
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

              <PasswordField
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === 'sign-in' ? 'current-password' : 'new-password'
                }
                minLength={6}
                required
              />

              {mode === 'sign-up' && (
                <PasswordField
                  visible={showPassword}
                  onToggle={() => setShowPassword((visible) => !visible)}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              )}

              {status === 'error' && (
                <p className="modal-error" role="alert">{errorMsg}</p>
              )}

              <button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting'
                  ? 'Please wait…'
                  : mode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            {mode === 'sign-in' && authErrorCode === 'email_not_confirmed' && (
              <div className="auth-confirmation-help">
                <button
                  type="button"
                  className="link-button"
                  onClick={handleResendConfirmation}
                  disabled={resendStatus === 'sending'}
                >
                  {resendStatus === 'sending'
                    ? 'Sending…'
                    : 'Resend confirmation email'}
                </button>
                {resendStatus === 'sent' && (
                  <p className="modal-success" role="status">
                    A new confirmation email has been sent.
                  </p>
                )}
                {resendStatus === 'error' && (
                  <p className="modal-error" role="alert">{resendError}</p>
                )}
              </div>
            )}

            {mode === 'sign-in' && (
              <p className="auth-switch">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setForgotPassword(true);
                    setStatus('idle');
                    setErrorMsg('');
                  }}
                >
                  Forgot your password?
                </button>
              </p>
            )}

            <p className="auth-legal">
              By continuing, you agree to the{' '}
              <a href={LAUNCH_LINKS.terms} target="_blank" rel="noreferrer">
                Terms of Use
              </a>{' '}
              and acknowledge the{' '}
              <a href={LAUNCH_LINKS.privacy} target="_blank" rel="noreferrer">
                Privacy Policy
              </a>
              .
            </p>

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

function PasswordField({ visible, onToggle, ...inputProps }) {
  return (
    <div className="password-field">
      <input type={visible ? 'text' : 'password'} {...inputProps} />
      <button
        type="button"
        className="password-visibility-button"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3 21 21M10.6 6.1c.46-.07.93-.1 1.4-.1 6 0 9.5 6 9.5 6a17 17 0 0 1-2.3 3M6.2 7.2A17 17 0 0 0 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.24 3.3-.63M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
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
