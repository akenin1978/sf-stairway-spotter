import { useEffect, useState } from 'react';

const DOTS = [
  { color: 'red', tx: -420, ty: 260 },
  { color: 'red', tx: -260, ty: 420 },
  { color: 'red', tx: -40, ty: 500 },
  { color: 'red', tx: 250, ty: 430 },
  { color: 'red', tx: 450, ty: 250 },
  { color: 'orange', tx: -430, ty: 40 },
  { color: 'orange', tx: -240, ty: 180 },
  { color: 'orange', tx: 170, ty: 220 },
  { color: 'orange', tx: 440, ty: 30 },
  { color: 'yellow', tx: -330, ty: -170 },
  { color: 'yellow', tx: 30, ty: -280 },
  { color: 'yellow', tx: 390, ty: -150 },
  { color: 'green', tx: -210, ty: -390 },
  { color: 'green', tx: 250, ty: -390 },
  { color: 'blue', tx: 40, ty: -540 },
];

export default function LaunchAnimation({ onComplete }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const exitTimer = window.setTimeout(() => setExiting(true), reduceMotion ? 350 : 1400);
    const completeTimer = window.setTimeout(onComplete, reduceMotion ? 700 : 2200);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`launch-animation${exiting ? ' launch-animation-exiting' : ''}`}
      role="status"
      aria-label="Opening SF Stairway Spotter"
    >
      <div className="launch-animation-glow" aria-hidden="true" />
      <div className="launch-animation-content">
        <div className="launch-animation-dots" aria-hidden="true">
          {DOTS.map((dot, index) => (
            <span
              className={`launch-animation-dot launch-animation-dot-${dot.color}`}
              key={`${dot.color}-${index}`}
              style={{
                '--dot-index': index,
                '--dot-exit-x': `${dot.tx}px`,
                '--dot-exit-y': `${dot.ty}px`,
              }}
            />
          ))}
        </div>
        <h1>SF Stairway Spotter</h1>
        <p>Discover San Francisco, one stairway at a time.</p>
      </div>
    </div>
  );
}
