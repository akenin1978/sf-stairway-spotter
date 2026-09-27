import React from 'react';

// Shared vertical stair artwork for onboarding and all badge medallions.
export default function StairGlyph({ color }) {
  return (
    <g fill={color}>
      <rect x="12" y="92" width="22" height="26" />
      <rect x="40" y="68" width="22" height="50" />
      <rect x="68" y="44" width="22" height="74" />
      <rect x="96" y="20" width="22" height="98" />
    </g>
  );
}

