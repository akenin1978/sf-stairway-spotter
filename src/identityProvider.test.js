import { describe, expect, it } from 'vitest';
import { currentIdentityProvider } from './identityProvider';

describe('currentIdentityProvider', () => {
  it('uses the current session provider when an account has multiple identities', () => {
    const user = {
      app_metadata: { provider: 'google', providers: ['apple', 'google'] },
      identities: [{ provider: 'apple' }, { provider: 'google' }],
    };

    expect(currentIdentityProvider(user)).toBe('google');
  });

  it('supports Apple as the current provider on a linked account', () => {
    const user = {
      app_metadata: { provider: 'apple', providers: ['apple', 'google'] },
      identities: [{ provider: 'google' }, { provider: 'apple' }],
    };

    expect(currentIdentityProvider(user)).toBe('apple');
  });

  it('falls back to an available identity or email', () => {
    expect(currentIdentityProvider({ identities: [{ provider: 'google' }] })).toBe('google');
    expect(currentIdentityProvider({ identities: [] })).toBe('email');
  });
});
