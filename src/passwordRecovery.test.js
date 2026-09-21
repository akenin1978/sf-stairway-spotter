import { describe, it, expect, vi } from 'vitest';
import { readRecoveryCallback, checkRecoverySession } from './passwordRecovery';

describe('password recovery callback', () => {
  it('rejects an expired link even when a user is already signed in', async () => {
    const auth = { getSession: vi.fn() };
    expect(await checkRecoverySession(auth, readRecoveryCallback('#error=access_denied&error_code=otp_expired'))).toBe(false);
    expect(auth.getSession).not.toHaveBeenCalled();
  });
  it('does not allow a plain reset URL or signup callback to use an existing session', async () => {
    const auth = { getSession: vi.fn() };
    for (const hash of ['', '#type=signup&access_token=fake&refresh_token=fake']) {
      expect(await checkRecoverySession(auth, readRecoveryCallback(hash))).toBe(false);
    }
    expect(auth.getSession).not.toHaveBeenCalled();
  });
  it('waits for recovery session validation before allowing a password change', async () => {
    const callback = readRecoveryCallback('#type=recovery&access_token=fake&refresh_token=fake');
    expect(await checkRecoverySession({ getSession: async () => ({ data: { session: { user: { id: 'test' } } } }) }, callback)).toBe(true);
    expect(await checkRecoverySession({ getSession: async () => ({ data: { session: null }, error: { message: 'invalid' } }) }, callback)).toBe(false);
  });
});
