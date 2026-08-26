const LANDING_HOSTS = new Set([
  'sfstairwayspotter.com',
  'www.sfstairwayspotter.com',
]);

export function shouldShowLandingPage(hostname, pathname) {
  const normalizedHost = hostname.toLowerCase();
  const normalizedPath = pathname.replace(/\/$/, '') || '/';

  return (
    normalizedPath === '/welcome' ||
    (normalizedPath === '/' && LANDING_HOSTS.has(normalizedHost))
  );
}
