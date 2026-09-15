import { afterEach, describe, expect, it, vi } from 'vitest';
import { acknowledgeVisitHint, hasAcknowledgedVisitHint } from './visitHint';

afterEach(() => vi.unstubAllGlobals());

describe('visit explanation acknowledgment', () => {
  it('only remembers the hint after explicit acknowledgment', () => {
    const values = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    expect(hasAcknowledgedVisitHint()).toBe(false);
    expect(values.size).toBe(0);
    acknowledgeVisitHint();
    expect(hasAcknowledgedVisitHint()).toBe(true);
    expect(hasAcknowledgedVisitHint()).toBe(true);
  });

  it('does not break the card when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('unavailable'); },
      setItem: () => { throw new Error('unavailable'); },
    });
    expect(hasAcknowledgedVisitHint()).toBe(false);
    expect(() => acknowledgeVisitHint()).not.toThrow();
  });
});
