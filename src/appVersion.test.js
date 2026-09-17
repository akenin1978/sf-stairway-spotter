import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NATIVE_BUILD_NUMBER } from './appVersion';

const settingsSource = readFileSync(
  new URL('./components/SettingsModal.jsx', import.meta.url),
  'utf8'
);

describe('app version display', () => {
  it('gets the native build number from the iOS project at build time', () => {
    expect(NATIVE_BUILD_NUMBER).toMatch(/^\d+$/);
    expect(settingsSource).toContain('Build ${NATIVE_BUILD_NUMBER}');
    expect(settingsSource).not.toMatch(/Build \d+/);
  });
});
