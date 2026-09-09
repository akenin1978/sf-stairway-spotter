export const VERIFICATION_LOCATION_MAX_AGE_MS = 15_000;
export const VERIFICATION_LOCATION_MAX_ACCURACY_METERS = 75;

export function assessVerificationPosition(position, now = Date.now()) {
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  const accuracy = Number(position?.coords?.accuracy);
  const timestamp = Number(position?.timestamp);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { usable: false, reason: 'missing-coordinates' };
  }

  if (
    !Number.isFinite(timestamp) ||
    timestamp <= 0 ||
    now < timestamp ||
    now - timestamp > VERIFICATION_LOCATION_MAX_AGE_MS
  ) {
    return { usable: false, reason: 'stale', accuracy };
  }

  if (
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    accuracy > VERIFICATION_LOCATION_MAX_ACCURACY_METERS
  ) {
    return { usable: false, reason: 'inaccurate', accuracy };
  }

  return { usable: true, accuracy };
}

const wait = (milliseconds) =>
  new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));

export async function acquireVerificationPosition(
  getPosition,
  {
    attempts = 3,
    retryDelayMs = 650,
    now = () => Date.now(),
    waitForRetry = wait,
  } = {}
) {
  let lastPosition = null;
  let lastAssessment = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const position = await getPosition({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 6_000,
    });
    const assessment = assessVerificationPosition(position, now());
    if (assessment.usable) return { position, assessment };

    lastPosition = position;
    lastAssessment = assessment;
    if (attempt < attempts - 1) await waitForRetry(retryDelayMs);
  }

  return {
    position: null,
    assessment: lastAssessment,
    lastPosition,
  };
}
