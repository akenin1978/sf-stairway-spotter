import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  VERIFICATION_SAFETY_TERMS_VERSION,
  hasAcceptedVerificationSafety,
} from './components/VerificationSafetyDialog.jsx';

describe('verification safety acknowledgment', () => {
  it('recognizes the current version saved on the account', () => {
    const user = {
      user_metadata: {
        verification_safety_terms_version: VERIFICATION_SAFETY_TERMS_VERSION,
      },
    };
    expect(hasAcceptedVerificationSafety(user)).toBe(true);
  });

  it('requires acknowledgment again when the saved version is old', () => {
    const user = {
      user_metadata: { verification_safety_terms_version: '2026-01-01' },
    };
    expect(hasAcceptedVerificationSafety(user)).toBe(false);
  });

  it('accepts the current in-session version after the account update', () => {
    expect(
      hasAcceptedVerificationSafety(null, VERIFICATION_SAFETY_TERMS_VERSION)
    ).toBe(true);
  });
});

describe('terms safety coverage', () => {
  const terms = readFileSync(
    new URL('./components/PublicPages.jsx', import.meta.url),
    'utf8'
  );

  it('covers changing conditions, street crossing, and non-waivable rights', () => {
    expect(terms).toContain('crossing streets');
    expect(terms).toContain('changing access conditions');
    expect(terms).toContain('gross negligence');
    expect(terms).toContain('Purchases and premium features');
  });
});
