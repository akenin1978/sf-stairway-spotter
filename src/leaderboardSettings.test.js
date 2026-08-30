import { describe, expect, it, vi } from 'vitest';
import {
  LEADERBOARD_OPT_OUT_MESSAGE,
  confirmLeaderboardSettingChange,
} from './leaderboardSettings';

describe('leaderboard setting changes', () => {
  it('asks for confirmation before opting out', () => {
    const confirmOptOut = vi.fn(() => true);

    const accepted = confirmLeaderboardSettingChange({
      currentlyOptedIn: true,
      nextOptedIn: false,
      confirmOptOut,
    });

    expect(accepted).toBe(true);
    expect(confirmOptOut).toHaveBeenCalledWith(LEADERBOARD_OPT_OUT_MESSAGE);
  });

  it('keeps the setting on when opting out is cancelled', () => {
    const accepted = confirmLeaderboardSettingChange({
      currentlyOptedIn: true,
      nextOptedIn: false,
      confirmOptOut: () => false,
    });

    expect(accepted).toBe(false);
  });

  it('does not interrupt someone who is opting in', () => {
    const confirmOptOut = vi.fn();

    const accepted = confirmLeaderboardSettingChange({
      currentlyOptedIn: false,
      nextOptedIn: true,
      confirmOptOut,
    });

    expect(accepted).toBe(true);
    expect(confirmOptOut).not.toHaveBeenCalled();
  });
});
