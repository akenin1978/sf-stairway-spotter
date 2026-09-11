import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const modalSource = readFileSync(
  new URL('./components/InAppPublicPage.jsx', import.meta.url),
  'utf8'
);
const publicPagesSource = readFileSync(
  new URL('./components/PublicPages.jsx', import.meta.url),
  'utf8'
);
const cssSource = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

describe('in-app support and legal pages', () => {
  it('opens Support, Privacy Policy, and Terms from the Menu without unmounting the map', () => {
    expect(appSource).toContain("setPublicPageOpen('support')");
    expect(appSource).toContain("setPublicPageOpen('privacy')");
    expect(appSource).toContain("setPublicPageOpen('terms')");
    expect(appSource.indexOf('<StairwayMap')).toBeLessThan(
      appSource.indexOf('{publicPageOpen && (')
    );
  });

  it('uses the same content components in the browser and in the app', () => {
    expect(publicPagesSource).toContain('export function SupportContent()');
    expect(publicPagesSource).toContain('export function PrivacyContent()');
    expect(publicPagesSource).toContain('export function TermsContent()');
    expect(modalSource).toContain('SupportContent');
    expect(modalSource).toContain('PrivacyContent');
    expect(modalSource).toContain('TermsContent');
  });

  it('starts its own scroller at the top and keeps close and browser controls explicit', () => {
    expect(modalSource).toContain('scrollRef.current.scrollTop = 0');
    expect(modalSource).toContain('aria-label={`Close ${title}`}');
    expect(modalSource).toContain('Open in browser');
    expect(modalSource).toContain('freshPublicPageUrl(path)');
    expect(cssSource).toMatch(/\.in-app-public-page\s*{[\s\S]*?position:\s*fixed/);
    expect(cssSource).toMatch(/\.in-app-public-page-scroll\s*{[\s\S]*?overflow-y:\s*auto/);
  });
});
