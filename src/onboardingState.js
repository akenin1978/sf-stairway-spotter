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

// This is a UI preference, never an authorization or safety-consent flag.
export const ONBOARDING_ACCOUNT_FLAG = 'stairway_intro_seen';
export function accountHasSeenOnboarding(user) {
  return user?.user_metadata?.[ONBOARDING_ACCOUNT_FLAG] === true;
}
export async function syncOnboardingCompletion(auth, userId) {
  try {
    const { data, error } = await auth.getUser();
    if (error || data?.user?.id !== userId) return false;
    if (accountHasSeenOnboarding(data.user)) return true;
    const result = await auth.updateUser({ data: { [ONBOARDING_ACCOUNT_FLAG]: true } });
    return !result.error;
  } catch { return false; }
}
