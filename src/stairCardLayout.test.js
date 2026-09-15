import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./components/StairwayMap.jsx', import.meta.url), 'utf8');

describe('stair card action hierarchy', () => {
  it('places verification and its error before guidance and past visits', () => {
    const action = source.indexOf('onClick={handlePhotoVerificationAction}');
    const error = source.indexOf('<VerificationError', action);
    const hint = source.indexOf('!visitHintAcknowledged', action);
    const history = source.indexOf('details={normalVisitDetails}');
    expect(action).toBeGreaterThan(-1);
    expect(error).toBeGreaterThan(action);
    expect(hint).toBeGreaterThan(error);
    expect(history).toBeGreaterThan(hint);
  });

  it('places the completed action before history after verification', () => {
    expect(source.indexOf('✓ Today’s visit verified')).toBeLessThan(
      source.indexOf('details={selectedVerificationReveal.afterDetails}')
    );
  });

  it('hides floating location controls when a card is selected', () => {
    expect(source).toContain('{!spotMode && !selected && (');
    const controls = source.slice(source.indexOf('{!spotMode && !selected && ('));
    expect(controls.indexOf('<CheckInNearbyButton')).toBeLessThan(controls.indexOf('</>'));
    expect(controls.indexOf('<LocateMeButton')).toBeLessThan(controls.indexOf('</>'));
    expect(source).toContain('{locationError && !selected && (');
  });

  it('keeps reversible spots compact and preserves the history safeguard', () => {
    expect(source).toContain("? 'spotted-status spotted-status--toggle'");
    expect(source).not.toContain('· Undo');
    expect(source).toContain('{selectedHasVisitHistory || selectedAlreadyVerified ? (');
    expect(source).toContain('aria-pressed={selectedDisplaySpotted}');
    expect(source).toContain('justSpottedId === selected.id');
  });
});
