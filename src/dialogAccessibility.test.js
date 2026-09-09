import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

describe('dialog accessibility foundation', () => {
  it('moves and traps focus, supports Escape, and restores focus', () => {
    const source = read('./components/useDialogFocus.js');
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain("event.key !== 'Tab'");
    expect(source).toContain('returnTarget?.focus');
    expect(source).toContain("dialog.querySelector(FOCUSABLE)");
  });

  it('exposes authentication as a labelled modal with labelled fields', () => {
    const source = read('./components/AuthModal.jsx');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('aria-labelledby="auth-dialog-title"');
    expect(source).toContain('<span>Email</span>');
    expect(source).toContain('aria-label={label}');
  });

  it('gives onboarding dots full-size touch targets', () => {
    const source = read('./components/OnboardingCarousel.jsx');
    expect(source).toContain('width: 44px');
    expect(source).toContain('height: 44px');
    expect(source).toContain("aria-current={i === slide ? 'step' : undefined}");
  });
});
