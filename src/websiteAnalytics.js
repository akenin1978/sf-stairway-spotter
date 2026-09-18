export const MEASUREMENT_ID = 'G-92VD3E01VM';
export const CONSENT_KEY = 'sfss-website-analytics-v1';
const hosts = new Set(['sfstairwayspotter.com', 'www.sfstairwayspotter.com']);
const paths = new Set(['/', '/welcome', '/press', '/faq', '/privacy', '/terms', '/support', '/delete-account']);

export function analyticsPage(url, isNative = false) {
  if (isNative || !hosts.has(url.hostname) || url.protocol !== 'https:') return null;
  const path = url.pathname.replace(/\/opened-[^/]+$/, '').replace(/\/$/, '') || '/';
  if (!paths.has(path) || url.searchParams.has('password-reset') || url.searchParams.has('code') || /access_token|refresh_token|type=recovery/.test(url.hash)) return null;
  const clean = new URL(path, url.origin);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = url.searchParams.get(key);
    if (value && /^[a-zA-Z0-9_-]{1,100}$/.test(value)) clean.searchParams.set(key, value);
  }
  return clean.href;
}

export function readAnalyticsChoice() {
  try {
    const choice = localStorage.getItem(CONSENT_KEY);
    return choice === 'granted' || choice === 'denied' ? choice : null;
  } catch { return null; }
}

export function saveAnalyticsChoice(choice) {
  try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* Session-only choice when storage is unavailable. */ }
}

let started = false;
export function startWebsiteAnalytics(pageLocation) {
  if (started || !pageLocation) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  window.gtag('js', new Date());
  let referrer = '';
  try { referrer = new URL(document.referrer).origin; } catch { /* No referrer. */ }
  window.gtag('config', MEASUREMENT_ID, {
    page_location: pageLocation,
    page_referrer: referrer,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: 'none',
    cookie_expires: 60 * 60 * 24 * 180,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function stopWebsiteAnalytics() {
  window[`ga-disable-${MEASUREMENT_ID}`] = true;
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.trim().split('=')[0];
    if (name === '_ga' || name.startsWith('_ga_')) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}
