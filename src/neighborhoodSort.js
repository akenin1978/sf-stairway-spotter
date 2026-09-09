export const STATS_NEIGHBORHOOD_GROUP_LABELS = [
  'Closest to completing',
  'In progress',
  'Completed',
  'Not started',
];

export function statsNeighborhoodGroup(neighborhood) {
  const remaining = neighborhood.total - neighborhood.spotted;
  if (remaining === 1) return 0;
  if (remaining > 0 && neighborhood.spotted > 0) return 1;
  if (remaining === 0) return 2;
  return 3;
}

export function goalOrientedNeighborhoodSort(a, b) {
  const aGroup = statsNeighborhoodGroup(a);
  const bGroup = statsNeighborhoodGroup(b);
  if (aGroup !== bGroup) return aGroup - bGroup;

  if (aGroup === 1) {
    const aRemaining = a.total - a.spotted;
    const bRemaining = b.total - b.spotted;
    return (
      aRemaining - bRemaining ||
      b.pct - a.pct ||
      a.name.localeCompare(b.name)
    );
  }

  return a.name.localeCompare(b.name);
}
