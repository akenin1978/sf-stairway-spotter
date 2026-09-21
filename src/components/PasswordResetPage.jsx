import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { friendlyAuthError } from '../authErrors';
import { LAUNCH_LINKS } from '../launchLinks';
import { readRecoveryCallback, checkRecoverySession } from '../passwordRecovery';

const callback = readRecoveryCallback(window.location.hash);

export default function PasswordResetPage() {
  const [phase, setPhase] = useState('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    checkRecoverySession(supabase.auth, callback).then((valid) => {
      if (active) {
        setPhase(valid ? 'reset' : 'request');
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
      }
    }).catch(() => {
      if (active) { setPhase('request'); setError('Unable to check this link. Check your connection and request a new email.'); }
    });
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (phase === 'reset' && password !== confirmation) {
      setError('Passwords do not match. Please try again.'); return;
    }
    setBusy(true);
    try {
      const result = phase === 'reset'
        ? await supabase.auth.updateUser({ password })
        : await supabase.auth.resetPasswordForEmail(email, { redirectTo: LAUNCH_LINKS.passwordReset });
      if (result.error) throw result.error;
      setPassword(''); setConfirmation('');
      setPhase(phase === 'reset' ? 'complete' : 'sent');
    } catch (err) {
      setError(friendlyAuthError(err, phase === 'reset' ? 'update-password' : 'reset-email'));
    } finally { setBusy(false); }
  }

  return <main className="password-reset-page">
    <section className="password-reset-card" aria-labelledby="reset-title">
      <p className="reset-brand">SF Stairway Spotter</p>
      <h1 id="reset-title">{phase === 'complete' ? 'Password updated' : phase === 'sent' ? 'Check your email' : phase === 'reset' ? 'Choose a new password' : 'Reset your password'}</h1>
      {phase === 'checking' && <p role="status">Checking your reset link…</p>}
      {phase === 'complete' && <p>Your new password is ready. Return to the SF Stairway Spotter iPhone app and sign in with it, or <a href="https://www.sfstairwayspotter.app/">open the web app</a>.</p>}
      {phase === 'sent' && <p role="status">If an account exists for that address, we’ve sent a reset email. Open the newest email and use its link promptly, just once.</p>}
      {(phase === 'request' || phase === 'reset') && <form onSubmit={submit}>
        {phase === 'request' ? <>
          <p>This reset link is missing, invalid, expired, or already used. Request a new link below.</p>
          <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        </> : <>
          <label>New password<input type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label>Confirm new password<input type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={6} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
          <button type="button" className="reset-text-button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Hide passwords' : 'Show passwords'}</button>
        </>}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Please wait…' : phase === 'reset' ? 'Update password' : 'Send a new reset link'}</button>
        {phase === 'reset' && <button type="button" className="reset-text-button" disabled={busy} onClick={() => { setPhase('request'); setError(''); setPassword(''); setConfirmation(''); }}>Request a new link instead</button>}
      </form>}
      <p><a href="https://www.sfstairwayspotter.com/support">Need help?</a></p>
    </section>
    <style>{`
      .password-reset-page { min-height:100dvh; box-sizing:border-box; padding:48px 20px; background:#f4f2ff; overflow:auto; color:#222; }
      .password-reset-card { max-width:440px; margin:0 auto; background:white; padding:28px; border-radius:20px; line-height:1.6; }
      .password-reset-card h1 { font-size:26px; line-height:1.25; }
      .reset-brand { color:#4b3ce0; font-weight:700; }
      .password-reset-card label { display:block; margin:16px 0; font-weight:600; }
      .password-reset-card input { display:block; box-sizing:border-box; width:100%; padding:12px; font:inherit; border:1px solid #aaa; border-radius:8px; }
      .password-reset-card button { background:#4b3ce0; color:white; padding:12px 18px; border:0; border-radius:10px; font:inherit; cursor:pointer; }
      .password-reset-card button:disabled { opacity:.6; cursor:wait; }
      .password-reset-card .reset-text-button { display:block; background:none; color:#4b3ce0; padding:10px 0; }
      .password-reset-card a { color:#4b3ce0; }
      .password-reset-card [role=alert] { color:#a12020; }
    `}</style>
  </main>;
}
