import { describe, expect, it, vi, afterEach } from 'vitest';
import { analyticsPage, startWebsiteAnalytics, stopWebsiteAnalytics, MEASUREMENT_ID } from './websiteAnalytics';

describe('public website analytics boundaries', () => {
  it('preserves campaign attribution but strips unrelated query strings and fragments', () => {
    expect(analyticsPage(new URL('https://www.sfstairwayspotter.com/?utm_source=sftravel&utm_medium=email&utm_campaign=stairway_month_2026&email=private@example.com#private'))).toBe('https://www.sfstairwayspotter.com/?utm_source=sftravel&utm_medium=email&utm_campaign=stairway_month_2026');
  });
  it('excludes app, development, native, and authentication pages', () => {
    for (const url of ['https://sfstairwayspotter.app/', 'http://localhost:5173/', 'https://www.sfstairwayspotter.com/join', 'https://www.sfstairwayspotter.com/?password-reset=1', 'https://www.sfstairwayspotter.com/?code=secret', 'https://www.sfstairwayspotter.com/#access_token=secret']) {
      expect(analyticsPage(new URL(url))).toBeNull();
    }
    expect(analyticsPage(new URL('https://www.sfstairwayspotter.com/'), true)).toBeNull();
  });
  it('normalizes public-page nonces and rejects freeform campaign values', () => {
    expect(analyticsPage(new URL('https://www.sfstairwayspotter.com/faq/opened-123?utm_source=private%40example.com'))).toBe('https://www.sfstairwayspotter.com/faq');
  });
});

describe('tag setup', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('loads once, disables ads, and allows immediate opt-out', () => {
    const appendChild = vi.fn();
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { referrer: 'https://example.com/private?token=secret', cookie: '', createElement: () => ({}), head: { appendChild } });
    startWebsiteAnalytics('https://www.sfstairwayspotter.com/');
    startWebsiteAnalytics('https://www.sfstairwayspotter.com/');
    expect(appendChild).toHaveBeenCalledTimes(1);
    const config = Array.from(window.dataLayer[2])[2];
    expect(config.page_referrer).toBe('https://example.com');
    expect(config.allow_google_signals).toBe(false);
    expect(config.allow_ad_personalization_signals).toBe(false);
    stopWebsiteAnalytics();
    expect(window[`ga-disable-${MEASUREMENT_ID}`]).toBe(true);
  });
});
