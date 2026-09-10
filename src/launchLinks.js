export const LAUNCH_LINKS = {
  privacy: 'https://www.sfstairwayspotter.com/privacy',
  terms: 'https://www.sfstairwayspotter.com/terms',
  support: 'https://www.sfstairwayspotter.com/support',
  deleteAccount: 'https://www.sfstairwayspotter.com/delete-account',
  passwordReset: 'https://www.sfstairwayspotter.com/?password-reset=1',
};

export function freshPublicPageUrl(url, nonce = Date.now()) {
  const freshUrl = new URL(url);
  freshUrl.searchParams.set('opened', String(nonce));
  // Do not use a fragment here. iOS's in-app Safari can apply fragment
  // scrolling after the page has mounted and override our top reset.
  freshUrl.hash = '';
  return freshUrl.toString();
}
