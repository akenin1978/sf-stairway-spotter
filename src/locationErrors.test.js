import { describe, expect, it } from 'vitest';
import {
  LOCATION_ERROR_KINDS,
  getLocationErrorKind,
  getLocationErrorMessage,
} from './locationErrors';

describe('location error messages', () => {
  it('recognizes browser permission denial', () => {
    expect(getLocationErrorKind({ code: 1 })).toBe(
      LOCATION_ERROR_KINDS.PERMISSION_DENIED
    );
  });

  it('recognizes browser timeout and unavailable errors separately', () => {
    expect(getLocationErrorKind({ code: 3 })).toBe(
      LOCATION_ERROR_KINDS.TIMEOUT
    );
    expect(getLocationErrorKind({ code: 2 })).toBe(
      LOCATION_ERROR_KINDS.UNAVAILABLE
    );
  });

  it('recognizes Capacitor permission, timeout, and disabled-service errors', () => {
    expect(getLocationErrorKind({ code: 'OS-PLUG-GLOC-0003' })).toBe(
      LOCATION_ERROR_KINDS.PERMISSION_DENIED
    );
    expect(getLocationErrorKind({ code: 'OS-PLUG-GLOC-0010' })).toBe(
      LOCATION_ERROR_KINDS.TIMEOUT
    );
    expect(getLocationErrorKind({ code: 'OS-PLUG-GLOC-0007' })).toBe(
      LOCATION_ERROR_KINDS.SERVICES_DISABLED
    );
    expect(
      getLocationErrorKind({
        code: 'OS-PLUG-GLOC-0009',
        message: 'Request to enable location was denied.',
      })
    ).toBe(LOCATION_ERROR_KINDS.SERVICES_DISABLED);
  });

  it('recognizes native temporarily unavailable errors', () => {
    expect(getLocationErrorKind({ code: 'OS-PLUG-GLOC-0002' })).toBe(
      LOCATION_ERROR_KINDS.UNAVAILABLE
    );
  });

  it('uses the message as a fallback when an error has no code', () => {
    expect(getLocationErrorKind(new Error('Location permission denied'))).toBe(
      LOCATION_ERROR_KINDS.PERMISSION_DENIED
    );
    expect(getLocationErrorKind(new Error('Position unavailable'))).toBe(
      LOCATION_ERROR_KINDS.UNAVAILABLE
    );
  });

  it('does not blame permissions for a timeout or temporary failure', () => {
    const timeoutMessage = getLocationErrorMessage({ code: 3 });
    const unavailableMessage = getLocationErrorMessage({ code: 2 });

    expect(timeoutMessage).toContain('in time');
    expect(unavailableMessage).toContain('temporarily unavailable');
    expect(timeoutMessage).not.toMatch(/permission/i);
    expect(unavailableMessage).not.toMatch(/permission/i);
  });

  it('gives permission denial an actionable settings message', () => {
    expect(getLocationErrorMessage({ code: 1 })).toMatch(
      /allow location access.*settings/i
    );
  });
});
