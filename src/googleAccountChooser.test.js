import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const authModal = readFileSync(
  new URL('./components/AuthModal.jsx', import.meta.url),
  'utf8'
);

describe('Google account switching on the web', () => {
  it('shows the account chooser instead of silently reusing the last account', () => {
    expect(authModal).toContain("queryParams: { prompt: 'select_account' }");
  });
});
