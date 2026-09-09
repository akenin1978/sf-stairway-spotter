import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const authModal = readFileSync(
  new URL('./components/AuthModal.jsx', import.meta.url),
  'utf8'
);
const app = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const checkIns = readFileSync(
  new URL('./CheckInsContext.jsx', import.meta.url),
  'utf8'
);
const map = readFileSync(
  new URL('./components/StairwayMap.jsx', import.meta.url),
  'utf8'
);

describe('post-login progress transition', () => {
  it('keeps sign-in covered until the current account history is ready', () => {
    expect(authModal).toContain("setStatus('loading-progress')");
    expect(authModal).toContain('user && accountProgressReady');
    expect(authModal).toContain('Loading your progress…');
    expect(checkIns).toContain('loadedUserId === user.id');
  });

  it('never presents a temporary zero count while progress loads', () => {
    expect(app).toContain("'Loading your progress…'");
    expect(app).toContain('disabled={!accountProgressReady}');
  });

  it('does not reset the map merely because authentication changed', () => {
    expect(map).toContain('<MapHomeView />');
    expect(map).not.toContain('sessionKey={user?.id');
    expect(map).not.toContain('[map, sessionKey]');
  });
});
