import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('./index.css', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('./main.jsx', import.meta.url), 'utf8');

describe('public page scrolling', () => {
  it('uses normal document scrolling instead of a nested mobile scroller', () => {
    expect(entry).toContain("'public-page-document'");
    expect(css).toMatch(/html\.public-page-document[\s\S]*?overflow:\s*visible/);

    const publicPageRule = css.match(/\.public-page\s*\{([\s\S]*?)\}/)?.[1] ?? '';
    expect(publicPageRule).not.toMatch(/height:\s*100%/);
    expect(publicPageRule).not.toMatch(/overflow-y:\s*auto/);
  });
});
