export const LOCATION_ERROR_KINDS = {
  PERMISSION_DENIED: 'permission-denied',
  TIMEOUT: 'timeout',
  SERVICES_DISABLED: 'services-disabled',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown',
};

const KNOWN_KINDS = new Set(Object.values(LOCATION_ERROR_KINDS));

export function getLocationErrorKind(error) {
  if (typeof error === 'string' && KNOWN_KINDS.has(error)) return error;

  const rawCode = error?.code;
  const code = typeof rawCode === 'string' ? rawCode.toUpperCase() : rawCode;
  const message = String(error?.message || error || '').toLowerCase();

  // Browser GeolocationPositionError codes and Capacitor Geolocation codes.
  // Prefer the structured code before using message text: for example,
  // Capacitor's "request to enable location was denied" means device Location
  // Services are off, not that this app's permission was denied.
  if (code === 1 || code === '1' || code === 'OS-PLUG-GLOC-0003') {
    return LOCATION_ERROR_KINDS.PERMISSION_DENIED;
  }

  if (code === 3 || code === '3' || code === 'OS-PLUG-GLOC-0010') {
    return LOCATION_ERROR_KINDS.TIMEOUT;
  }

  if (
    [
      'OS-PLUG-GLOC-0007',
      'OS-PLUG-GLOC-0008',
      'OS-PLUG-GLOC-0009',
      'OS-PLUG-GLOC-0017',
    ].includes(code)
  ) {
    return LOCATION_ERROR_KINDS.SERVICES_DISABLED;
  }

  if (
    code === 2 ||
    code === '2' ||
    [
      'OS-PLUG-GLOC-0002',
      'OS-PLUG-GLOC-0014',
      'OS-PLUG-GLOC-0015',
      'OS-PLUG-GLOC-0016',
    ].includes(code)
  ) {
    return LOCATION_ERROR_KINDS.UNAVAILABLE;
  }

  if (
    /location services?.*(off|disabled|restricted)|network and location.*off/.test(
      message
    )
  ) {
    return LOCATION_ERROR_KINDS.SERVICES_DISABLED;
  }
  if (/timed?\s*out|timeout/.test(message)) {
    return LOCATION_ERROR_KINDS.TIMEOUT;
  }
  if (/permission|not allowed|denied/.test(message)) {
    return LOCATION_ERROR_KINDS.PERMISSION_DENIED;
  }
  if (
    /position unavailable|temporarily unavailable|unable to (obtain|retrieve).*location/.test(
      message
    )
  ) {
    return LOCATION_ERROR_KINDS.UNAVAILABLE;
  }

  return LOCATION_ERROR_KINDS.UNKNOWN;
}

export function getLocationErrorMessage(errorOrKind) {
  const kind = getLocationErrorKind(errorOrKind);

  if (kind === LOCATION_ERROR_KINDS.PERMISSION_DENIED) {
    return (
      'Location access is turned off for SF Stairway Spotter. Allow location ' +
      'access in your device or browser settings, then try again.'
    );
  }
  if (kind === LOCATION_ERROR_KINDS.TIMEOUT) {
    return (
      "We couldn't get a location fix in time. Move somewhere with a clearer " +
      'view of the sky and try again.'
    );
  }
  if (kind === LOCATION_ERROR_KINDS.SERVICES_DISABLED) {
    return 'Location Services appear to be turned off. Turn them on and try again.';
  }
  if (kind === LOCATION_ERROR_KINDS.UNAVAILABLE) {
    return 'Your location is temporarily unavailable. Try again in a moment.';
  }
  return "We couldn't get your location. Try again.";
}
