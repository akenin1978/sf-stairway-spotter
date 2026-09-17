import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./components/StairwayMap.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

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
    expect(source).toContain('<MapActionsOverlay>');
    expect(source).toContain('overlay.getPanes()?.floatPane');
    expect(source).toContain('pane.insertBefore(container, pane.firstChild)');
    expect(source).toContain('className="floating-map-actions"');
    expect(source).not.toContain('position={ControlPosition.RIGHT_BOTTOM}');
    expect(source).not.toContain('{!spotMode && !selected && (');
    const overlayStart = source.indexOf('<MapActionsOverlay>');
    const overlayEnd = source.indexOf('</MapActionsOverlay>', overlayStart);
    const mapEnd = source.indexOf('</Map>', overlayEnd);
    const infoWindow = source.indexOf('<InfoWindow', overlayEnd);
    expect(overlayStart).toBeGreaterThan(source.indexOf('<Map'));
    expect(overlayEnd).toBeGreaterThan(overlayStart);
    expect(mapEnd).toBeGreaterThan(overlayEnd);
    expect(infoWindow).toBeGreaterThan(overlayEnd);
    expect(source.slice(overlayStart, overlayEnd)).toContain('<CheckInNearbyButton');
    expect(source.slice(overlayStart, overlayEnd)).toContain('<LocateMeButton');
    expect(source.slice(overlayStart, overlayEnd)).toContain('location-error-popover');
    expect(source.slice(overlayStart, overlayEnd)).toContain('<MapControlsPanel');
  });

  it('keeps reversible spots compact and preserves the history safeguard', () => {
    expect(source).toContain("? 'spotted-status spotted-status--toggle'");
    expect(source).not.toContain('· Undo');
    expect(source).toContain('{selectedHasVisitHistory || selectedAlreadyVerified ? (');
    expect(source).toContain('aria-pressed={selectedDisplaySpotted}');
    expect(source).toContain('justSpottedId === selected.id');
  });

  it('shows the dark-green just-spotted state before the save request finishes', () => {
    const toggleStart = source.indexOf('async function performCheckInToggle');
    const toggleEnd = source.indexOf('// --- Photo verification state ---', toggleStart);
    const toggleSource = source.slice(toggleStart, toggleEnd);
    const optimisticVisual = toggleSource.indexOf(
      'setJustSpottedId(wasAdding ? stairway.id : null)'
    );
    const saveRequest = toggleSource.indexOf(
      'await toggleCheckIn(stairway.id)'
    );

    expect(optimisticVisual).toBeGreaterThan(-1);
    expect(saveRequest).toBeGreaterThan(optimisticVisual);
    expect(toggleSource).toContain(
      'if (result.error && wasAdding)'
    );
    expect(toggleSource).toContain('setJustSpottedId(null)');
  });

  it('uses the same typeface for button and non-button spotted states', () => {
    const spottedStatusStart = styles.indexOf('.spotted-status {');
    const spottedStatusEnd = styles.indexOf('}', spottedStatusStart);
    const spottedStatusStyles = styles.slice(spottedStatusStart, spottedStatusEnd);

    expect(spottedStatusStyles).toContain('font-family: inherit;');
  });
});
