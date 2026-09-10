import { describe, expect, it } from 'vitest';
import {
  friendRequestNotice,
  incomingFriendRequests,
  seenFriendRequestStorageKey,
  unseenFriendRequests,
} from './friendRequests';

const requests = [
  {
    friendship_id: 'incoming-1',
    i_am_requester: false,
    status: 'pending',
    friend_display_name: 'Stair Fan',
    friend_email: 'stair@example.com',
  },
  { friendship_id: 'sent-1', i_am_requester: true, status: 'pending' },
  { friendship_id: 'accepted-1', i_am_requester: false, status: 'accepted' },
];

describe('friend request notifications', () => {
  it('selects only incoming pending requests', () => {
    expect(incomingFriendRequests(requests).map((item) => item.friendship_id)).toEqual([
      'incoming-1',
    ]);
  });

  it('does not repeat a request already seen on this installation', () => {
    expect(unseenFriendRequests(requests, ['incoming-1'])).toEqual([]);
  });

  it('names the sender without exposing their email', () => {
    expect(friendRequestNotice([requests[0]])).toBe(
      'Stair Fan sent you a friend request.'
    );
    expect(friendRequestNotice([requests[0]])).not.toContain('stair@example.com');
  });

  it('keeps notification state separate for each signed-in account', () => {
    expect(seenFriendRequestStorageKey('user-1')).not.toBe(
      seenFriendRequestStorageKey('user-2')
    );
  });
});
