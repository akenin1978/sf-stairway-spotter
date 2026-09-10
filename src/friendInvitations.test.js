import { describe, expect, it } from 'vitest';
import {
  FRIEND_INVITE_TEXT,
  FRIEND_INVITE_URL,
  friendInviteMailto,
  friendInviteShareData,
} from './friendInvitations';

describe('friend invitations', () => {
  it('uses a privacy-friendly message instead of exposing the username', () => {
    const invitation = friendInviteShareData();

    expect(invitation.text).toBe(FRIEND_INVITE_TEXT);
    expect(invitation.text).toMatch(/^Your friend invited you/);
    expect(invitation.url).toBe(FRIEND_INVITE_URL);
  });

  it('provides an email fallback addressed to the entered recipient', () => {
    const href = friendInviteMailto('friend+stairs@example.com');

    expect(href).toContain('mailto:friend%2Bstairs%40example.com');
    expect(decodeURIComponent(href)).toContain(FRIEND_INVITE_TEXT);
    expect(decodeURIComponent(href)).toContain(FRIEND_INVITE_URL);
  });
});
