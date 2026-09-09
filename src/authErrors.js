const NETWORK_ERROR_PATTERN = /failed to fetch|network|load failed|offline/i;

export function friendlyAuthError(error, operation = 'auth') {
  const code = error?.code || '';
  const status = Number(error?.status || 0);
  const message = String(error?.message || '');

  if (NETWORK_ERROR_PATTERN.test(message)) {
    return 'You appear to be offline. Check your connection and try again.';
  }
  if (code === 'invalid_credentials') {
    return 'Email or password is incorrect. Please try again.';
  }
  if (code === 'email_not_confirmed') {
    return 'Please confirm your email before signing in. Check your inbox, or request another confirmation email.';
  }
  if (code === 'user_already_exists' || code === 'email_exists') {
    return 'An account may already exist for this email. Try signing in or resetting your password.';
  }
  if (code === 'email_address_invalid' || code === 'validation_failed') {
    return 'Enter a valid email address.';
  }
  if (code === 'weak_password') {
    return operation === 'update-password'
      ? 'Your password could not be updated. Choose a stronger password and try again.'
      : 'Choose a stronger password and try again.';
  }
  if (
    code === 'otp_expired' ||
    code === 'flow_state_expired' ||
    code === 'flow_state_not_found'
  ) {
    return 'This password-reset link has expired or has already been used. Request a new link and try again.';
  }
  if (code === 'no_authorization' || code === 'bad_jwt') {
    return operation === 'update-password'
      ? 'This password-reset link is no longer valid. Request a new link.'
      : 'Your sign-in session is no longer valid. Please sign in again.';
  }
  if (code === 'reauthentication_needed' || code === 'reauthentication_not_valid') {
    return 'For your security, please sign in again before changing your password.';
  }
  if (
    status === 429 ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit'
  ) {
    return operation === 'reset-email'
      ? 'Please wait before requesting another reset email.'
      : operation === 'confirmation-email'
        ? 'Please wait a moment before requesting another email.'
        : 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (code === 'email_address_not_authorized') {
    return "We couldn't send email to that address. Please contact Support.";
  }
  if (
    code === 'email_provider_disabled' ||
    code === 'provider_disabled' ||
    code === 'oauth_provider_not_supported'
  ) {
    return 'This sign-in option is temporarily unavailable. Please use another method or try again later.';
  }

  return 'Something went wrong. Please try again. If the problem continues, contact Support.';
}
