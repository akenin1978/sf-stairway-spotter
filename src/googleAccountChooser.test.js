import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const authModal = readFileSync(
  new URL('./components/AuthModal.jsx', import.meta.url),
  'utf8'
);

const webGoogleAuth = readFileSync(
  new URL('./webGoogleAuth.js', import.meta.url),
  'utf8'
);

describe('direct Google sign-in on the web', () => {
  it('uses Google Identity Services instead of a Supabase-hosted OAuth redirect', () => {
    expect(authModal).toContain('renderGoogleSignInButton');
    expect(authModal).toContain('signInWithGoogleCredential');
    expect(authModal).not.toContain("provider: 'google',\n      options:");
    expect(webGoogleAuth).toContain('https://accounts.google.com/gsi/client');
    expect(webGoogleAuth).toContain('window.google.accounts.id.renderButton');
    expect(webGoogleAuth).toContain('supabase.auth.signInWithIdToken');
    expect(webGoogleAuth).toContain('DEFAULT_GOOGLE_WEB_CLIENT_ID');
  });
});
