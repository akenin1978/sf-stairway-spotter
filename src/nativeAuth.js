import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from './supabaseClient';
import { isNativeApp } from './nativeDevice';

const APPLE_CLIENT_ID = 'com.sfstairwayspotter.app';
const googleIOSClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID;
const googleWebClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;

let initializePromise;

export function isNativeGoogleConfigured() {
  return Boolean(googleIOSClientId && googleWebClientId);
}

export async function clearNativeGoogleSession() {
  if (!isNativeApp() || !isNativeGoogleConfigured()) return;

  try {
    await initializeNativeAuth();
    await SocialLogin.logout({ provider: 'google' });
  } catch (error) {
    // Signing out of the app must still succeed if Google's local session
    // cannot be cleared. The next Google login can recover normally.
    console.warn('Could not clear the saved Google sign-in session', error);
  }
}

async function initializeNativeAuth() {
  if (!isNativeApp()) throw new Error('native-auth-unavailable');
  if (!initializePromise) {
    const options = {
      apple: { clientId: APPLE_CLIENT_ID },
    };
    if (isNativeGoogleConfigured()) {
      options.google = {
        iOSClientId: googleIOSClientId,
        iOSServerClientId: googleWebClientId,
        webClientId: googleWebClientId,
        mode: 'online',
      };
    }
    initializePromise = SocialLogin.initialize(options);
  }
  return initializePromise;
}

async function createNoncePair() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw)
  );
  const hashed = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  return { raw, hashed };
}

export async function signInWithNativeProvider(provider) {
  if (provider === 'google' && !isNativeGoogleConfigured()) {
    throw new Error('google-native-not-configured');
  }

  await initializeNativeAuth();
  const nonce = await createNoncePair();
  const login = await SocialLogin.login({
    provider,
    options: {
      nonce: nonce.hashed,
      scopes: provider === 'apple' ? ['email', 'name'] : ['email', 'profile'],
      ...(provider === 'google' ? { forcePrompt: true } : {}),
    },
  });

  const idToken = login.result?.idToken;
  if (!idToken) throw new Error(`${provider}-missing-id-token`);

  const { error } = await supabase.auth.signInWithIdToken({
    provider,
    token: idToken,
    nonce: nonce.raw,
  });
  if (error) throw error;

  if (provider === 'apple') {
    const { givenName, familyName } = login.result.profile ?? {};
    const fullName = [givenName, familyName].filter(Boolean).join(' ');
    if (fullName) {
      const { error: profileError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          given_name: givenName,
          family_name: familyName,
        },
      });
      if (profileError) console.error('Could not save Apple profile name', profileError);
    }
  }
}
