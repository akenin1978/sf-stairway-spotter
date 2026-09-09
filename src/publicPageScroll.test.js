import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

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
    expect(pages).toContain('<main id="top" className="public-page">');
    expect(links.match(/#top/g)).toHaveLength(4);
    expect(css).toMatch(/html\.public-page-document[\s\S]*?overflow-anchor:\s*none/);
  });
});
