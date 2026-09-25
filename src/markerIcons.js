// At most six rating colors x three states. Draw each icon once at 3x density;
// Google can reuse raster markers rather than laying out separate SVG/text.
const icons = new Map();
export function getStairwayMarkerIcon(color, isChecked, isVerified) {
  const state = isVerified ? 'verified' : isChecked ? 'spotted' : 'plain';
  const key = `${color}:${state}`;
  if (icons.has(key)) return icons.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 54;
  const ctx = canvas.getContext('2d');
  ctx.scale(3, 3);
  ctx.beginPath();
  ctx.arc(9, 9, 8, 0, Math.PI * 2);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (state !== 'plain') {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (state === 'spotted') {
      // Center the visible checkmark, rather than the font's line box.
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const ink = ctx.measureText('✓');
      ctx.fillText('✓',
        9 + (ink.actualBoundingBoxLeft - ink.actualBoundingBoxRight) / 2,
        9 + (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2);
    } else {
      ctx.fillText('★', 9, 9);
    }
  }
  const icon = {
    url: canvas.toDataURL('image/png'),
    scaledSize: new window.google.maps.Size(18, 18),
    anchor: new window.google.maps.Point(9, 9),
  };
  icons.set(key, icon);
  return icon;
}
