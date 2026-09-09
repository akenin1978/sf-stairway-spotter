import { describe, expect, it, vi } from 'vitest';
import {
  acquireVerificationPosition,
  assessVerificationPosition,
  VERIFICATION_LOCATION_MAX_ACCURACY_METERS,
} from './verificationLocation.js';

const NOW = 1_800_000_000_000;

function position({ ageMs = 0, accuracy = 12 } = {}) {
  return {
    timestamp: NOW - ageMs,
    coords: { latitude: 37.75627, longitude: -122.47326, accuracy },
  };
}

describe('verification location quality', () => {
  it('rejects a stale location before distance is calculated', () => {
    expect(assessVerificationPosition(position({ ageMs: 20_000 }), NOW)).toMatchObject({
      usable: false,
      reason: 'stale',
    });
  });

  it('rejects a location whose accuracy is too poor for verification', () => {
    expect(
      assessVerificationPosition(
        position({ accuracy: VERIFICATION_LOCATION_MAX_ACCURACY_METERS + 1 }),
        NOW
      )
    ).toMatchObject({ usable: false, reason: 'inaccurate' });
  });

  it('requests uncached readings until a fresh accurate one arrives', async () => {
    const getPosition = vi
      .fn()
      .mockResolvedValueOnce(position({ ageMs: 60_000 }))
      .mockResolvedValueOnce(position({ accuracy: 200 }))
      .mockResolvedValueOnce(position());
    const waitForRetry = vi.fn().mockResolvedValue();

    const result = await acquireVerificationPosition(getPosition, {
      now: () => NOW,
      waitForRetry,
    });

    expect(result.position).toEqual(position());
    expect(getPosition).toHaveBeenCalledTimes(3);
    expect(getPosition).toHaveBeenCalledWith(
      expect.objectContaining({ maximumAge: 0, enableHighAccuracy: true })
    );
    expect(waitForRetry).toHaveBeenCalledTimes(2);
  });

  it('returns no position when every reading remains unreliable', async () => {
    const getPosition = vi.fn().mockResolvedValue(position({ ageMs: 60_000 }));
    const result = await acquireVerificationPosition(getPosition, {
      attempts: 2,
      now: () => NOW,
      waitForRetry: vi.fn().mockResolvedValue(),
    });

    expect(result.position).toBeNull();
    expect(result.assessment.reason).toBe('stale');
  });
});
