export function addNearbyThumbnailPhotos(nearbyResults, photoRows = []) {
  const photosById = new Map(
    photoRows.map((row) => [row.id, row.direct_photo_url])
  );

  return nearbyResults.map(({ stairway, distanceMeters }) => ({
    distanceMeters,
    stairway: {
      ...stairway,
      direct_photo_url:
        photosById.get(stairway.id) || stairway.direct_photo_url || null,
    },
  }));
}
