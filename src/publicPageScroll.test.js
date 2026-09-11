import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { freshPublicPageUrl } from './launchLinks';

const css = fs.readFileSync(new URL('./index.css', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');
const pages = fs.readFileSync(
  new URL('./components/PublicPages.jsx', import.meta.url),
  'utf8'
);
const links = fs.readFileSync(new URL('./launchLinks.js', import.meta.url), 'utf8');

describe('public page scrolling', () => {
  it('uses normal document scrolling instead of a nested mobile scroller', () => {
    expect(entry).toContain("'public-page-document'");
    expect(css).toMatch(/html\.public-page-document[\s\S]*?overflow:\s*visible/);

    const publicPageRule = css.match(/\.public-page\s*\{([\s\S]*?)\}/)?.[1] ?? '';
    expect(publicPageRule).not.toMatch(/height:\s*100%/);
    expect(publicPageRule).not.toMatch(/overflow-y:\s*auto/);
  });

  it('overrides mobile browser scroll restoration and targets the page top', () => {
    expect(pages).toContain("window.history.scrollRestoration = 'manual'");
    expect(pages).toContain("window.addEventListener('pageshow', resetScroll)");
    expect(pages).toContain('window.setInterval(resetScroll, 100)');
    expect(pages).toContain("window.addEventListener('touchmove', releaseTopLock");
    expect(pages).not.toContain("window.addEventListener('touchstart', releaseTopLock");
    expect(entry).toContain("window.location.hash === '#top'");
    expect(entry).toContain('window.history.replaceState');
    expect(pages).toContain('<main id="top" className="public-page">');
    expect(links).not.toContain('#top');
    expect(css).toMatch(/html\.public-page-document[\s\S]*?overflow-anchor:\s*none/);
  });

  it('gives menu links a fresh URL so mobile browsers cannot restore an old position', () => {
    const freshUrl = new URL(
      freshPublicPageUrl('https://www.sfstairwayspotter.com/support#top', 1234)
    );
    expect(freshUrl.searchParams.get('opened')).toBe('1234');
    expect(freshUrl.hash).toBe('');
  });
});
