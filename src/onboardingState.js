const DEVICE_KEY = 'sf_stairway_onboarding_seen';

export function onboardingKey(userId) {
  return userId ? `${DEVICE_KEY}:user:${userId}` : DEVICE_KEY;
}

export function hasSeenOnboarding(key, dismissed, storage = () => window.localStorage) {
  if (dismissed.has(key)) return true;
  try {
    return storage().getItem(key) === 'true';
  } catch {
    // Storage can be unavailable in a private browser or restricted WebView.
    return false;
  }
}

export function rememberOnboarding(key, dismissed, storage = () => window.localStorage) {
  // Also avoid showing the anonymous guide again immediately after sign-out.
  for (const seenKey of new Set([key, DEVICE_KEY])) {
    dismissed.add(seenKey);
    try {
      storage().setItem(seenKey, 'true');
    } catch {
      // Dismissal must still work for this session when persistence fails.
    }
  }
}
