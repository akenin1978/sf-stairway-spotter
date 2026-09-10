import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');

describe('Build 16 release regressions', () => {
  it('shows the approved one-time location tooltip and VoiceOver label', () => {
    const map = read('./components/StairwayMap.jsx');
    expect(map).toContain("'sf_stairway_location_tooltip_seen'");
    expect(map).toContain('Your location');
    expect(map).toContain('aria-label="Center map on my location"');
    expect(map).toContain("localStorage.setItem(LOCATION_TOOLTIP_SEEN_KEY, 'true')");
  });

  it('requires a server-side username only for newly inserted friend requests', () => {
    const migration = read(
      '../supabase/migrations/20260910120000_require_username_for_friend_requests.sql'
    );
    expect(migration).toContain("nullif(trim(display_name), '') is not null");
    expect(migration).toContain('before insert on public.friendships');
    expect(migration).toContain('Existing pending requests are deliberately preserved');
  });
});
