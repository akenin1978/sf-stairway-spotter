import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('./components/StatsModal.jsx', import.meta.url),
  'utf8'
);
const styles = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

describe('stats metric hierarchy', () => {
  it('shows verified progress first and retains spotted checklist progress', () => {
    expect(source).toContain('const { checkedInIds, checkedInMethods, verifiedCount } = useCheckIns()');

    const verified = source.indexOf('stairways verified');
    const spotted = source.indexOf('stairways spotted');

    expect(verified).toBeGreaterThan(-1);
    expect(spotted).toBeGreaterThan(verified);
    expect(source).toContain('stats-summary-block stats-summary-block--primary');
    expect(source).toContain('{verifiedCount} / {stats.totalStairways}');
    expect(source).toContain('{stats.totalSpotted} / {stats.totalStairways}');
    expect(source).toContain('includes {verifiedCount} verified');
  });

  it('gives both metrics card structure while reserving lavender for verified', () => {
    const summaryStart = styles.indexOf('.stats-summary-block {');
    const summaryEnd = styles.indexOf('}', summaryStart);
    const primaryStart = styles.indexOf('.stats-summary-block--primary {');
    const primaryEnd = styles.indexOf('}', primaryStart);

    expect(styles.slice(summaryStart, summaryEnd)).toContain('background: #f5f5f5;');
    expect(styles.slice(primaryStart, primaryEnd)).toContain('background: #f0edff;');
  });

  it('uses a consistent 16px rhythm between the main stats sections', () => {
    expect(styles).toContain('.stats-streak-hint {');
    expect(styles).toContain('margin: 0 0 16px;');

    const summaryStart = styles.indexOf('.stats-summary-row {');
    const summaryEnd = styles.indexOf('}', summaryStart);
    expect(styles.slice(summaryStart, summaryEnd)).toContain('margin-bottom: 16px;');

    const legendStart = styles.indexOf('.stats-progress-legend {');
    const legendEnd = styles.indexOf('}', legendStart);
    expect(styles.slice(legendStart, legendEnd)).toContain('margin: -5px 0 16px;');
    expect(styles).toContain('.stats-neighborhood-list > .stats-neighborhood-group-heading:first-child');
  });

  it('offers combined, verified, and spotted-only neighborhood views', () => {
    expect(source).toContain('View progress by:');
    expect(source).not.toContain('All progress by neighborhood');
    expect(source).not.toContain('Verified by neighborhood');
    expect(source).not.toContain('Saved for later by neighborhood');
    expect(source).toContain("['all', 'All progress']");
    expect(source).toContain("['verified', 'Verified']");
    expect(source).toContain("['spotted-only', 'Spotted only']");
    expect(source).toContain('stats-neighborhood-bar-segment--verified');
    expect(source).toContain('stats-neighborhood-bar-segment--spotted');
    expect(source).toContain("checkedInMethods.get(s.id) === 'photo-verified'");
    expect(source).toContain('Math.max(0, spotted - verified)');
  });

  it('treats spotted-only progress as a saved-for-later list', () => {
    expect(source).toContain('.filter((neighborhood) => neighborhood.spottedOnly > 0)');
    expect(source).toContain('b.spottedOnly - a.spottedOnly');
    expect(source).toContain('No spotted-only stairways yet.');
  });

  it('labels both streak values in weeks', () => {
    expect(source).toContain('weekCount(streak?.current_streak)');
    expect(source).toContain('weekCount(streak?.longest_streak)');
    expect(source).toContain('className="stats-streak-unit"');
    expect(source).toContain('<span className="stats-streak-label">current streak</span>');
    expect(source).toContain('<span className="stats-streak-label">longest streak</span>');
  });
});
