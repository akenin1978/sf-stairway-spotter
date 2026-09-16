import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');
const map = readFileSync(
  new URL('./components/StairwayMap.jsx', import.meta.url),
  'utf8'
);

describe('badge stairway card requests', () => {
  it('consumes each request once before opening its first stairway', () => {
    expect(map).toContain('const handledBadgeRequestRef = useRef(null)');
    expect(map).toContain(
      'if (handledBadgeRequestRef.current === requestToken) return'
    );
    expect(map).toContain('handledBadgeRequestRef.current = requestToken');
    expect(map).toContain('onBadgeStairwayRequestConsumed?.(requestToken)');
    expect(map.indexOf('onBadgeStairwayRequestConsumed?.(requestToken)')).toBeLessThan(
      map.indexOf('setSelected(stairway)', map.indexOf('onBadgeStairwayRequestConsumed?.(requestToken)'))
    );
  });

  it('clears the consumed request in App and on account changes', () => {
    expect(app).toContain('const consumeBadgeStairwayRequest = useCallback(');
    expect(app).toContain('return currentToken === requestToken ? null : current');
    expect(app).toContain(
      'onBadgeStairwayRequestConsumed={consumeBadgeStairwayRequest}'
    );
    expect(app).toMatch(
      /useEffect\(\(\) => \{\s*setBadgeStairwayRequest\(null\);\s*\}, \[user\?\.id\]\);/
    );
  });
});
