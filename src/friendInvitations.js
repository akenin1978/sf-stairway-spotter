export const FRIEND_INVITE_URL = 'https://www.sfstairwayspotter.com';

export const FRIEND_INVITE_TITLE = 'Join me on SF Stairway Spotter';

export const FRIEND_INVITE_TEXT =
  'Your friend invited you to join them on SF Stairway Spotter—discover San Francisco’s public stairways, track your progress, and compare verified climbs.';

export function friendInviteShareData() {
  return {
    title: FRIEND_INVITE_TITLE,
    text: FRIEND_INVITE_TEXT,
    url: FRIEND_INVITE_URL,
  };
}

export function friendInviteMailto(email = '') {
  const body = `${FRIEND_INVITE_TEXT}\n\n${FRIEND_INVITE_URL}`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    FRIEND_INVITE_TITLE
  )}&body=${encodeURIComponent(body)}`;
}
