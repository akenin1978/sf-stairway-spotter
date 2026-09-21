// Capture callback intent before Supabase consumes/removes the URL fragment.
export function readRecoveryCallback(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    error: params.has('error') || params.has('error_code'),
    recovery: params.get('type') === 'recovery' && params.has('access_token') && params.has('refresh_token'),
  };
}

export async function checkRecoverySession(auth, callback) {
  if (callback.error) return false;
  // A pre-existing sign-in alone must not make an invalid reset link valid.
  if (!callback.recovery) return false;
  const { data, error } = await auth.getSession();
  return !error && Boolean(data?.session);
}
