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

  it('keeps floating location controls available behind a selected card', () => {
    expect(source).toContain('<MapControl');
    expect(source).toContain('position={ControlPosition.RIGHT_BOTTOM}');
    expect(source).toContain('className="floating-map-actions"');
    expect(source).not.toContain('{!spotMode && !selected && (');
    const mapControlStart = source.indexOf('<MapControl');
    const mapControlEnd = source.indexOf('</MapControl>', mapControlStart);
    const mapEnd = source.indexOf('</Map>', mapControlEnd);
    const infoWindow = source.indexOf('<InfoWindow', mapControlEnd);
    expect(mapControlStart).toBeGreaterThan(source.indexOf('<Map'));
    expect(mapControlEnd).toBeGreaterThan(mapControlStart);
    expect(mapEnd).toBeGreaterThan(mapControlEnd);
    expect(infoWindow).toBeGreaterThan(mapControlEnd);
    expect(source.slice(mapControlStart, mapControlEnd)).toContain('<CheckInNearbyButton');
    expect(source.slice(mapControlStart, mapControlEnd)).toContain('<LocateMeButton');
    expect(source.slice(mapControlStart, mapControlEnd)).toContain('location-error-popover');
  });

  it('keeps reversible spots compact and preserves the history safeguard', () => {
    expect(source).toContain("? 'spotted-status spotted-status--toggle'");
    expect(source).not.toContain('· Undo');
    expect(source).toContain('{selectedHasVisitHistory || selectedAlreadyVerified ? (');
    expect(source).toContain('aria-pressed={selectedDisplaySpotted}');
    expect(source).toContain('justSpottedId === selected.id');
  });
});
