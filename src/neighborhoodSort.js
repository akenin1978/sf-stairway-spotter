export const STATS_NEIGHBORHOOD_GROUP_LABELS = [
  'Closest to completing',
  'In progress',
  'Completed',
  'Not started',
];

export function statsNeighborhoodGroup(neighborhood) {
  const remaining = neighborhood.total - neighborhood.spotted;
  if (neighborhood.spotted === 0) return 3;
  if (remaining === 1) return 0;
  if (remaining > 0) return 1;
  if (remaining === 0) return 2;
  return 3;
}

export function goalOrientedNeighborhoodSort(a, b) {
  const aGroup = statsNeighborhoodGroup(a);
  const bGroup = statsNeighborhoodGroup(b);
  if (aGroup !== bGroup) return aGroup - bGroup;

  if (aGroup === 0 || aGroup === 1) {
    const aRemaining = a.total - a.spotted;
    const bRemaining = b.total - b.spotted;
    return (
      b.pct - a.pct ||
      aRemaining - bRemaining ||
      a.name.localeCompare(b.name)
    );
  }

  if (aGroup === 3) {
    return a.total - b.total || a.name.localeCompare(b.name);
  }

  return a.name.localeCompare(b.name);
}
