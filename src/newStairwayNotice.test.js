import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  findServerNewStairwayNotice,
  findNewStairwayNotice,
  knownStairwayIdsKey,
  MAX_NOTICE_STAIRWAYS,
  serializeKnownStairwayIds,
} from './newStairwayNotice';

const stairways = [
  { id: 'older', updated_at: '2026-08-20T12:00:00Z' },
  { id: 'newest', updated_at: '2026-08-27T12:00:00Z' },
];
const mapSource = readFileSync(
  new URL('./components/StairwayMap.jsx', import.meta.url),
  'utf8'
);
const modalSource = readFileSync(
  new URL('./components/NewStairwayModal.jsx', import.meta.url),
  'utf8'
);
const newAccountMigration = readFileSync(
  new URL(
    '../supabase/migrations/20260916061500_show_post_launch_stairways_to_new_accounts.sql',
    import.meta.url
  ),
  'utf8'
);
const snapshotTypeFixMigration = readFileSync(
  new URL(
    '../supabase/migrations/20260916222500_fix_new_stairway_notice_snapshot_type.sql',
    import.meta.url
  ),
  'utf8'
);

describe('new stairway notices', () => {
  it('stays quiet when there is no previous snapshot', () => {
    expect(findNewStairwayNotice(stairways, null)).toBeNull();
  });

  it('does not interrupt a brand-new visitor with a celebration', () => {
    const rows = Array.from({ length: 1239 }, (_, index) => ({
      id: `stairway-${index}`,
      updated_at: '2026-08-28T12:00:00Z',
    }));
    expect(findNewStairwayNotice(rows, null)).toBeNull();
  });

  it('keeps snapshots separate for each signed-in account', () => {
    expect(knownStairwayIdsKey('reviewer')).toBe(
      'sf-stairway-spotter:known-stairway-ids:v2:reviewer'
    );
    expect(knownStairwayIdsKey('another-user')).not.toBe(
      knownStairwayIdsKey('reviewer')
    );
    expect(knownStairwayIdsKey(null)).toBe(
      'sf-stairway-spotter:known-stairway-ids:v2:this-device'
    );
  });

  it('stays quiet when every stairway was already known', () => {
    expect(findNewStairwayNotice(stairways, '["older","newest"]')).toBeNull();
  });

  it('chooses the most recently updated genuinely new stairway', () => {
    expect(findNewStairwayNotice(stairways, '[]')).toEqual({
      stairway: stairways[1],
      stairways: [stairways[1], stairways[0]],
      addedCount: 2,
      stairwayCount: 2,
    });
  });

  it('uses first-added timestamps for the durable account notice', () => {
    const rows = [
      { id: 'existing', added_at: '2026-09-15T10:00:00Z' },
      { id: 'added', added_at: '2026-09-15T11:00:00Z' },
    ];
    expect(
      findServerNewStairwayNotice(
        rows,
        '2026-09-15T10:30:00Z',
        '2026-09-15T11:30:00Z'
      )
    ).toMatchObject({ addedCount: 1, stairway: rows[1] });
  });

  it('distinguishes PostgreSQL timestamps within the same millisecond', () => {
    const rows = [
      { id: 'microsecond-new', added_at: '2026-09-16T05:54:05.220344+00:00' },
    ];

    expect(
      findServerNewStairwayNotice(
        rows,
        '2026-09-16T05:54:05.220343+00:00',
        '2026-09-16T05:54:05.220999+00:00'
      )
    ).toMatchObject({ addedCount: 1, stairway: rows[0] });
  });

  it('serializes the exact IDs for the next visit', () => {
    expect(serializeKnownStairwayIds(stairways)).toBe('["older","newest"]');
  });

  it('bounds oversized notices without losing the true addition count', () => {
    const additions = Array.from(
      { length: MAX_NOTICE_STAIRWAYS + 5 },
      (_, index) => ({
        id: `new-${index}`,
        added_at: `2026-09-16T12:00:${String(index).padStart(2, '0')}Z`,
      })
    );

    const notice = findServerNewStairwayNotice(
      additions,
      '2026-09-16T11:59:59Z',
      '2026-09-16T12:01:00Z'
    );

    expect(notice.addedCount).toBe(MAX_NOTICE_STAIRWAYS + 5);
    expect(notice.stairways).toHaveLength(MAX_NOTICE_STAIRWAYS);
    expect(modalSource).toContain('See latest ${stairways.length} of ${addedCount}');
  });

  it('covers the complete baseline, sync, relaunch, and dismiss flow', () => {
    const baselineRows = [
      { id: 'known', added_at: '2026-09-15T10:00:00Z' },
    ];
    const baseline = serializeKnownStairwayIds(baselineRows);
    const afterSync = [
      ...baselineRows,
      { id: 'new-real-stairway', added_at: '2026-09-15T11:00:00Z' },
    ];

    const notice = findNewStairwayNotice(afterSync, baseline);
    expect(notice).toMatchObject({
      addedCount: 1,
      stairway: afterSync[1],
    });

    const acknowledged = serializeKnownStairwayIds(afterSync);
    expect(findNewStairwayNotice(afterSync, acknowledged)).toBeNull();
  });

  it('does not mark additions known until the notice is acknowledged', () => {
    expect(mapSource).toContain('snapshotValue: serializeKnownStairwayIds(allRows)');
    expect(mapSource).toContain('function acknowledgeNewStairwayNotice');
    expect(mapSource).toContain('onDismiss={() => acknowledgeNewStairwayNotice()}');
    expect(mapSource).toContain('onBadgeStairwayViewed?.(stairwayToShow.id)');
  });

  it('checks for additions whenever the app returns to the foreground', () => {
    expect(mapSource).toContain(
      "if (document.visibilityState === 'visible') loadStairways();"
    );
    expect(mapSource).not.toContain('lastLoadedAt > 60_000');
  });

  it('uses the durable account cursor when the database support is available', () => {
    expect(mapSource).toContain("rpc('get_new_stairway_notice_state')");
    expect(mapSource).toContain("rpc('acknowledge_new_stairways'");
  });

  it('renders the map before waiting for the optional notice request', () => {
    const renderMapAt = mapSource.indexOf('setStairways(allRows)');
    const requestNoticeAt = mapSource.indexOf(
      "rpc('get_new_stairway_notice_state')"
    );

    expect(renderMapAt).toBeGreaterThan(-1);
    expect(requestNoticeAt).toBeGreaterThan(renderMapAt);
  });

  it('does not restore the global loading state for background refreshes', () => {
    expect(mapSource).toContain('const hasLoadedStairwaysRef = useRef(false)');
    expect(mapSource).toContain(
      'if (!hasLoadedStairwaysRef.current) setLoading(true)'
    );
    expect(mapSource).toContain('hasLoadedStairwaysRef.current = true');
  });

  it('starts new accounts after the legacy collection instead of after recent additions', () => {
    expect(newAccountMigration).toContain(
      "'2026-09-15 21:50:05.276012+00'::timestamptz"
    );
    expect(newAccountMigration).toContain(
      'values (auth.uid(), legacy_collection_through)'
    );
    expect(newAccountMigration).not.toContain(
      'values (auth.uid(), current_time)'
    );
  });

  it('returns a timestamptz snapshot instead of PostgreSQL current_time', () => {
    expect(snapshotTypeFixMigration).toContain(
      'snapshot_at timestamptz := now()'
    );
    expect(snapshotTypeFixMigration).toContain(
      'select state.seen_through, snapshot_at'
    );
    expect(snapshotTypeFixMigration).not.toContain(
      'current_time timestamptz'
    );
  });

  it('keeps a device snapshot without leaking notices between accounts', () => {
    expect(mapSource).toContain('const localNotice = findNewStairwayNotice');
    expect(mapSource).toContain(
      'const notice = notificationUser?.id ? (serverNotice || localNotice) : null'
    );
    expect(mapSource).toContain(
      'noticeIdentityRef.current !== notificationUser.id'
    );
    expect(mapSource).toContain(
      'localStorage.setItem(storageKey, serializeKnownStairwayIds(allRows))'
    );
  });
});
