export const LAUNCH_LINKS = {
  privacy: 'https://www.sfstairwayspotter.com/privacy#top',
  terms: 'https://www.sfstairwayspotter.com/terms#top',
  support: 'https://www.sfstairwayspotter.com/support#top',
  deleteAccount: 'https://www.sfstairwayspotter.com/delete-account#top',
  passwordReset: 'https://www.sfstairwayspotter.com/?password-reset=1',
};

export function freshPublicPageUrl(url, nonce = Date.now()) {
  const freshUrl = new URL(url);
  freshUrl.searchParams.set('opened', String(nonce));
  freshUrl.hash = 'top';
  return freshUrl.toString();
}
