import {
  formatVisitDate,
  mayorshipProgressText,
} from '../verifiedVisits';

export default function VerifiedVisitPanel({
  details,
  loading,
  justVerified = false,
  justBecameMayor = false,
}) {
  if (loading) {
    return <p className="verified-visits-loading">Loading visit history…</p>;
  }
  if (!details?.summary) return null;

  const { summary, history } = details;
  const totalVisits = Number(summary.total_visits || 0);
  if (totalVisits === 0) return null;
  const progressText = mayorshipProgressText(summary);

  return (
    <section className="verified-visits-panel" aria-label="Verified visits">
      <h4>{justVerified ? '✓ Verified today' : 'Verified visits'}</h4>

      <p className="verified-visits-total">
        You’ve verified this stairway {totalVisits}{' '}
        {totalVisits === 1 ? 'time' : 'times'}.
      </p>

      {summary.eligible &&
        (summary.is_mayor ? (
          <p
            className={
              'mayorship-current-user' +
              (justBecameMayor ? ' mayorship-new-crown' : '')
            }
          >
            👑 {justBecameMayor ? 'You’re the new mayor! ' : ''}
            {progressText}
          </p>
        ) : (
          <>
            {summary.mayor_visit_count > 0 && (
              <p className="mayorship-incumbent">
                👑 Mayor:{' '}
                <strong>{summary.mayor_display_name || 'Another Spotter'}</strong>{' '}
                · {summary.mayor_visit_count}{' '}
                {Number(summary.mayor_visit_count) === 1 ? 'visit' : 'visits'}
              </p>
            )}
            {progressText && <p className="mayorship-progress">{progressText}</p>}
          </>
        ))}

      {summary.visited_today && (
        <p className="verified-today-note">
          Today’s visit is counted. Your next visit can count tomorrow.
        </p>
      )}

      {history?.length > 0 && (
        <details className="verified-visit-history">
          <summary>View all {history.length} verified visits</summary>
          <ol>
            {history.map((visit, index) => (
              <li key={`${visit.visited_at}-${index}`}>
                {formatVisitDate(visit.visited_at)}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
