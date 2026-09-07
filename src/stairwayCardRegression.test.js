import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('./components/StairwayMap.jsx', import.meta.url),
  'utf8'
);

describe('stairway card regressions', () => {
  it('keeps the selected stairway open after toggling Spotted', () => {
    const start = source.indexOf('async function performCheckInToggle');
    const end = source.indexOf('// --- Photo verification state ---', start);
    const spottedFlow = source.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(spottedFlow).toContain('showCompletionMessage');
    expect(spottedFlow).not.toContain('setSelected');
    expect(spottedFlow).not.toContain('closeSelectedAfterSuccess');
  });

  it('shows success feedback without replacing the card controls', () => {
    expect(source).toContain('{completionMessage && (');
    expect(source).not.toContain('{completionMessage ? (');
  });

  it('retries GPS and saving without forcing another photo', () => {
    expect(source).toContain('retainedVerificationCaptureRef');
    expect(source).toContain('Retry verification');
    expect(source).toContain('retryPhotoVerification');
    expect(source).not.toContain('finally {\n      await temporaryPhoto?.discard();');
  });

  it('keeps verified results open for reading', () => {
    expect(source).toContain("showCompletionMessage('Verified! ✓');");
    expect(source).not.toContain(
      "showCompletionMessage('Verified! ✓', stairway.id);"
    );
  });
});
