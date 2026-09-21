import { describe, expect, it } from 'vitest';
import { onboardingKey, hasSeenOnboarding, rememberOnboarding } from './onboardingState';

function fixture() {
  const values = new Map();
  const storage = () => ({ getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) });
  return { values, storage, dismissed: new Set() };
}

describe('first-account onboarding', () => {
  it('shows a new account the guide even after an anonymous visitor dismissed it', () => {
    const { storage, dismissed } = fixture();
    rememberOnboarding(onboardingKey(), dismissed, storage);
    expect(hasSeenOnboarding(onboardingKey('new-account'), dismissed, storage)).toBe(false);
  });
  it('persists dismissal across reloads without suppressing a different account', () => {
    const { storage, dismissed } = fixture();
    rememberOnboarding(onboardingKey('account-a'), dismissed, storage);
    expect(hasSeenOnboarding(onboardingKey('account-a'), new Set(), storage)).toBe(true);
    expect(hasSeenOnboarding(onboardingKey('account-b'), new Set(), storage)).toBe(false);
    expect(hasSeenOnboarding(onboardingKey(), new Set(), storage)).toBe(true);
  });
  it('does not migrate the old device flag to a new account', () => {
    const { values, storage, dismissed } = fixture();
    values.set('sf_stairway_onboarding_seen', 'true');
    expect(hasSeenOnboarding(onboardingKey(), dismissed, storage)).toBe(true);
    expect(hasSeenOnboarding(onboardingKey('new-account'), dismissed, storage)).toBe(false);
  });
  it('can show and dismiss the guide if browser storage is inaccessible', () => {
    const dismissed = new Set();
    const storage = () => { throw new Error('Storage blocked'); };
    const key = onboardingKey('account-a');
    expect(hasSeenOnboarding(key, dismissed, storage)).toBe(false);
    expect(() => rememberOnboarding(key, dismissed, storage)).not.toThrow();
    expect(hasSeenOnboarding(key, dismissed, storage)).toBe(true);
    expect(hasSeenOnboarding(onboardingKey('account-b'), dismissed, storage)).toBe(false);
  });
});
