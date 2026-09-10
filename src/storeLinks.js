// Add each public store listing URL here only after that listing is live.
// Download controls stay hidden when their URL is blank, so the website never
// sends visitors to a dead or pre-release store page.
export const STORE_LINKS = {
  appStore: '',
  googlePlay: '',
};

export function hasStoreLinks() {
  return Boolean(STORE_LINKS.appStore || STORE_LINKS.googlePlay);
}
