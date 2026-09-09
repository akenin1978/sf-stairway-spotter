import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  addVerifiedCountsToFriends,
  verifiedFriendLabel,
} from './friendProgress.js';

describe('friend verified progress', () => {
  it('adds aggregate counts only to accepted friends', () => {
    const friends = [
      { friend_user_id: 'accepted', status: 'accepted' },
      { friend_user_id: 'pending', status: 'pending' },
    ];
    const result = addVerifiedCountsToFriends(friends, [
      { user_id: 'accepted', verified_count: '107' },
    ]);

    expect(result[0].verified_count).toBe(107);
    expect(result[1].verified_count).toBeNull();
  });

  it('uses zero when an accepted friend has not verified a stairway', () => {
    const [friend] = addVerifiedCountsToFriends([
      { friend_user_id: 'new-friend', status: 'accepted' },
    ]);
    expect(friend.verified_count).toBe(0);
    expect(verifiedFriendLabel(friend.verified_count)).toBe('0 verified');
  });

  it('exposes only an aggregate for accepted friends', () => {
    const migration = readFileSync(
      new URL(
        '../supabase/migrations/20260909100000_add_friend_verified_counts.sql',
        import.meta.url
      ),
      'utf8'
    );
    expect(migration).toContain("friendships.status = 'accepted'");
    expect(migration).toContain("checkins.verification_method = 'photo-verified'");
    expect(migration).toContain('count(distinct checkins.stairway_id)');
    expect(migration).toContain(
      'revoke execute on function public.get_friend_verified_counts() from anon'
    );
    expect(migration).toContain('security definer');
    expect(migration).not.toContain('visited_at');
    expect(migration).not.toContain('photo_url');
  });
});
