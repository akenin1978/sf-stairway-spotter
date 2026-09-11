import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { shouldShowLandingPage } from './siteRouting';

describe('shouldShowLandingPage', () => {
  it('shows the landing page at the .com homepage', () => {
    expect(shouldShowLandingPage('sfstairwayspotter.com', '/')).toBe(true);
    expect(shouldShowLandingPage('www.sfstairwayspotter.com', '/')).toBe(true);
  });

  it('keeps the map at the .app homepage', () => {
    expect(shouldShowLandingPage('sfstairwayspotter.app', '/')).toBe(false);
  });

  it('provides a landing-page preview path on any host', () => {
    expect(shouldShowLandingPage('localhost', '/welcome')).toBe(true);
  });

  it('leaves legal routes available on the .com host', () => {
    expect(shouldShowLandingPage('sfstairwayspotter.com', '/privacy')).toBe(false);
    expect(shouldShowLandingPage('sfstairwayspotter.com', '/join')).toBe(false);
  });

  it('routes direct invitation visits through the deployed app', () => {
    const vercelConfig = JSON.parse(
      readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')
    );
    expect(vercelConfig.rewrites).toContainEqual({
      source: '/join',
      destination: '/index.html',
    });
  });

  it('does not cache public-page HTML in mobile browsers', () => {
    const vercelConfig = JSON.parse(
      readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')
    );

    expect(vercelConfig.headers).toContainEqual({
      source: '/(privacy|terms|support|delete-account|join)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
        },
      ],
    });
  });

  it('opens the app rather than the landing page for password recovery', () => {
    expect(
      shouldShowLandingPage(
        'www.sfstairwayspotter.com',
        '/',
        '?password-reset=1'
      )
    ).toBe(false);
  });
});
