import { describe, expect, it } from 'vitest';
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
  });
});
