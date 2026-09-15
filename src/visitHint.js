const KEY = 'sf_stairway_visit_hint_acknowledged_v1';

export function hasAcknowledgedVisitHint() {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function acknowledgeVisitHint() {
  try {
    localStorage.setItem(KEY, 'true');
  } catch {
    // The caller still dismisses the hint for this app session.
  }
}
