import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const badges = readFileSync(new URL('./components/BadgesModal.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

describe('badge notification touch targets', () => {
  it('makes the entire actionable badge tile open its new stairways', () => {
    expect(badges).toContain("const Tile = canShowStairways ? 'button' : 'div'");
    expect(badges).toContain('onClick: onShowStairways');
    expect(badges).toContain("'aria-label': actionLabel");
    expect(badges).not.toContain('className="badge-tile-notification"\n            onClick=');
  });

  it('provides a reliable mobile touch target and visible keyboard focus', () => {
    expect(styles).toMatch(/\.badge-tile-action\s*\{[\s\S]*min-width:\s*44px;[\s\S]*min-height:\s*44px;/);
    expect(styles).toContain('.badge-tile-action:focus-visible');
    expect(styles).toMatch(/\.badge-tile-notification\s*\{[\s\S]*pointer-events:\s*none;/);
  });
});
