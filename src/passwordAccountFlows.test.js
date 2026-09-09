import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const authModal = fs.readFileSync(
  new URL('./components/AuthModal.jsx', import.meta.url),
  'utf8'
);
const authContext = fs.readFileSync(
  new URL('./AuthContext.jsx', import.meta.url),
  'utf8'
);

describe('email password account flows', () => {
  it('requires matching passwords when creating an account', () => {
    expect(authModal).toContain("mode === 'sign-up' && password !== confirmPassword");
    expect(authModal).toContain('placeholder="Confirm password"');
  });

  it('sends password reset email without revealing whether an account exists', () => {
    expect(authModal).toContain('resetPasswordForEmail');
    expect(authModal).toContain('If an account exists for');
  });

  it('opens a new-password form for Supabase recovery links', () => {
    expect(authContext).toContain("event === 'PASSWORD_RECOVERY'");
    expect(authModal).toContain('supabase.auth.updateUser({ password })');
    expect(authModal).toContain('Confirm new password');
  });

  it('lets people show or hide every password field', () => {
    expect(authModal).toContain("type={visible ? 'text' : 'password'}");
    expect(authModal).toContain("visible ? `Hide ${label.toLowerCase()}`");
    expect(authModal).toContain(": `Show ${label.toLowerCase()}`");
  });

  it('can resend an account confirmation email', () => {
    expect(authModal).toContain("supabase.auth.resend({ type: 'signup', email })");
    expect(authModal).toContain('Resend confirmation email');
    expect(authModal).toContain('A new confirmation email has been sent.');
  });

  it('uses friendly error messages instead of raw authentication responses', () => {
    expect(authModal).toContain('friendlyAuthError(error');
    expect(authModal).not.toContain('setErrorMsg(error.message)');
    expect(authModal).toContain("authErrorCode === 'email_not_confirmed'");
  });
});
