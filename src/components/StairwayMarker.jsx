import { memo, useCallback, useMemo } from 'react';
import { Marker } from '@vis.gl/react-google-maps';
import { getStairwayMarkerIcon } from '../markerIcons';
import { getRatingStyle } from '../ratingColors';
import { getStairwayMarkerPosition } from '../stairwayMapGeometry';

// Each unchanged stairway skips React work even when viewport/progress changes.
// Stable option objects also avoid unnecessary Google marker setOptions calls.
function StairwayMarker({ stairway, isChecked, isVerified, spotMode, onSelect }) {
  const color = getRatingStyle(stairway.rating).color;
  const position = useMemo(() => getStairwayMarkerPosition(stairway), [stairway]);
  const icon = useMemo(() => getStairwayMarkerIcon(color, isChecked, isVerified),
    [color, isChecked, isVerified]);
  const handleClick = useCallback(() => {
    if (!spotMode) onSelect(stairway);
  }, [spotMode, onSelect, stairway]);
  // Google requires non-optimized markers for keyboard and screen-reader access.
  // Reuse cached raster artwork without removing each marker's accessible button.
  return <Marker position={position} title={stairway.description || 'Stairway'}
    onClick={handleClick} icon={icon} optimized={false} />;
}
export default memo(StairwayMarker);
