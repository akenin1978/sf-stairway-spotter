import { supabase } from './supabaseClient';

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const googleWebClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;

let googleIdentityPromise;

export function isWebGoogleConfigured() {
  return Boolean(googleWebClientId);
}

export function loadGoogleIdentityServices() {
  if (!isWebGoogleConfigured()) {
    return Promise.reject(new Error('google-web-not-configured'));
  }
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleIdentityPromise) return googleIdentityPromise;

  googleIdentityPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`
    );
    const script = existing || document.createElement('script');

    const handleLoad = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else reject(new Error('google-identity-unavailable'));
    };
    const handleError = () => reject(new Error('google-identity-load-failed'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existing) {
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    googleIdentityPromise = undefined;
    throw error;
  });

  return googleIdentityPromise;
}

export function renderGoogleSignInButton(element, onCredential) {
  if (!element) throw new Error('google-button-container-missing');

  window.google.accounts.id.initialize({
    client_id: googleWebClientId,
    callback: onCredential,
    auto_select: false,
    cancel_on_tap_outside: false,
  });

  element.replaceChildren();
  window.google.accounts.id.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: Math.min(Math.max(Math.round(element.clientWidth), 240), 400),
  });
}

export async function signInWithGoogleCredential(credential) {
  if (!credential) throw new Error('google-missing-id-token');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential,
  });
  if (error) throw error;
}
