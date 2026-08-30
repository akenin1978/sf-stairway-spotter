import { describe, expect, it } from 'vitest';
import {
  didBecomeMayor,
  firstRpcRow,
  isMissingVerifiedVisitsRpc,
  mayorshipProgressText,
  verificationButtonLabel,
} from './verifiedVisits.js';

describe('verified visit helpers', () => {
  it('normalizes Supabase RPC rows', () => {
    expect(firstRpcRow([{ total_visits: 2 }])).toEqual({ total_visits: 2 });
    expect(firstRpcRow([])).toBeNull();
    expect(firstRpcRow({ total_visits: 1 })).toEqual({ total_visits: 1 });
  });

  it('recognizes a not-yet-installed visit RPC', () => {
    expect(isMissingVerifiedVisitsRpc({ code: 'PGRST202' })).toBe(true);
    expect(
      isMissingVerifiedVisitsRpc({
        message: 'Could not find the function public.record_verified_visit',
      })
    ).toBe(true);
    expect(isMissingVerifiedVisitsRpc({ message: 'Network unavailable' })).toBe(false);
  });

  it('changes the verification button after today is counted', () => {
    expect(verificationButtonLabel(null, false)).toBe('Verify with a photo');
    expect(verificationButtonLabel(null, true)).toBe("Verify today's visit");
    expect(verificationButtonLabel({ visited_today: false }, true)).toBe(
      "Verify today's visit"
    );
    expect(verificationButtonLabel({ visited_today: true }, true)).toBe(
      '✓ Verified today'
    );
  });

  it('explains the live mayorship gap', () => {
    expect(
      mayorshipProgressText({
        eligible: true,
        is_mayor: false,
        visits_needed: '2',
        mayor_visit_count: '5',
      })
    ).toBe('2 more verified visits to take the lead.');

    expect(
      mayorshipProgressText({
        eligible: true,
        is_mayor: false,
        visits_needed: 2,
        mayor_visit_count: 0,
      })
    ).toBe('2 more verified visits to become mayor.');
  });

  it('preserves the incumbent message and hides competition when opted out', () => {
    expect(
      mayorshipProgressText({
        eligible: true,
        is_mayor: true,
        my_mayorship_visit_count: '4',
      })
    ).toBe('You’re the mayor with 4 verified visits in the past 30 days.');
    expect(mayorshipProgressText({ eligible: false, is_mayor: false })).toBe('');
  });

  it('celebrates only a confirmed transition into the mayorship', () => {
    expect(
      didBecomeMayor(
        { eligible: true, is_mayor: false },
        { eligible: true, is_mayor: true }
      )
    ).toBe(true);
    expect(
      didBecomeMayor(null, { eligible: true, is_mayor: true })
    ).toBe(false);
    expect(
      didBecomeMayor(
        { eligible: true, is_mayor: true },
        { eligible: true, is_mayor: true }
      )
    ).toBe(false);
  });
});
