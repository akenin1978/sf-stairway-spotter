import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LOCATION_CACHE_MAX_AGE_MS,
  isLocationFresh,
} from './locationLifecycle';

const mapSource = readFileSync(
  new URL('./components/StairwayMap.jsx', import.meta.url),
  'utf8'
);

describe('location lifecycle', () => {
  it('keeps the approved full-city mobile home framing', () => {
    expect(mapSource).toContain('const SF_CENTER = { lat: 37.735, lng: -122.4194 }');
    expect(mapSource).toContain('const SF_MOBILE_HOME_ZOOM = 12.25');
  });

  it('uses a close neighborhood view when centering on my location', () => {
    const panStart = mapSource.indexOf('function PanToUserLocation');
    const homeViewStart = mapSource.indexOf('function MapHomeView', panStart);
    const panSource = mapSource.slice(panStart, homeViewStart);

    expect(panStart).toBeGreaterThan(-1);
    expect(homeViewStart).toBeGreaterThan(panStart);
    expect(panSource).toContain('map.setZoom(17)');
  });

  it('reuses a recent location but rejects one made stale in the background', () => {
    const location = { lat: 37.74, lng: -122.42 };
    const now = 1_000_000;

    expect(isLocationFresh(location, now - 10_000, now)).toBe(true);
    expect(
      isLocationFresh(location, now - LOCATION_CACHE_MAX_AGE_MS - 1, now)
    ).toBe(false);
    expect(isLocationFresh(null, now, now)).toBe(false);
    expect(isLocationFresh(location, 0, now)).toBe(false);
  });

  it('pauses and resumes live location with app visibility', () => {
    expect(mapSource).toContain(
      "document.addEventListener('visibilitychange', handleVisibilityChange)"
    );
    expect(mapSource).toContain("document.visibilityState === 'hidden'");
    expect(mapSource).toContain('myLocationUpdatedAtRef.current = 0');
    expect(mapSource).toContain('stopLocationWatch();');
    expect(mapSource).toContain(
      'startLocationWatch({ centerOnFirstFix: false })'
    );
  });

  it('clears a transient warning when the watcher recovers', () => {
    const watchStart = mapSource.indexOf('const startLocationWatch');
    const locateStart = mapSource.indexOf('async function handleLocateMe', watchStart);
    const watchSource = mapSource.slice(watchStart, locateStart);

    expect(watchStart).toBeGreaterThan(-1);
    expect(locateStart).toBeGreaterThan(watchStart);
    expect(watchSource).toContain("setLocationError('')");
    expect(watchSource).toContain('myLocationUpdatedAtRef.current = Date.now()');
  });
});
