import { describe, expect, it } from 'vitest';
import { friendlyAuthError } from './authErrors';

describe('friendlyAuthError', () => {
  it('replaces credential and confirmation errors', () => {
    expect(friendlyAuthError({ code: 'invalid_credentials' })).toBe(
      'Email or password is incorrect. Please try again.'
    );
    expect(friendlyAuthError({ code: 'email_not_confirmed' })).toMatch(
      /confirm your email/i
    );
  });

  it('does not definitively reveal whether an account exists', () => {
    expect(friendlyAuthError({ code: 'user_already_exists' })).toMatch(
      /may already exist/i
    );
  });

  it('uses operation-specific messages for email rate limits', () => {
    expect(friendlyAuthError({ status: 429 }, 'reset-email')).toBe(
      'Please wait before requesting another reset email.'
    );
    expect(
      friendlyAuthError(
        { code: 'over_email_send_rate_limit' },
        'confirmation-email'
      )
    ).toBe('Please wait a moment before requesting another email.');
  });

  it('recognizes connectivity failures without exposing technical text', () => {
    expect(friendlyAuthError({ message: 'Failed to fetch' })).toMatch(/offline/i);
  });

  it('falls back to a safe, actionable message', () => {
    expect(friendlyAuthError({ code: 'unexpected_failure' })).toMatch(
      /try again/i
    );
  });
});
