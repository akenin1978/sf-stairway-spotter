export const LEADERBOARD_OPT_OUT_MESSAGE =
  'Opt out of the leaderboard?\n\n' +
  'Your public leaderboard stats and any mayorships will disappear. ' +
  'Your private verified-visit history will remain.';

export function confirmLeaderboardSettingChange({
  currentlyOptedIn,
  nextOptedIn,
  confirmOptOut,
}) {
  if (!currentlyOptedIn || nextOptedIn) return true;
  return confirmOptOut(LEADERBOARD_OPT_OUT_MESSAGE);
}
