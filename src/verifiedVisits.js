export function firstRpcRow(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

export function isMissingVerifiedVisitsRpc(error) {
  if (!error) return false;
  return (
    error.code === 'PGRST202' ||
    /record_verified_visit|get_stairway_visit_summary|get_my_verified_visit_history/i.test(
      error.message || ''
    )
  );
}

export function formatVisitDate(value, options = {}) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(options.locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: options.timeZone || 'America/Los_Angeles',
  });
}

export function verificationButtonLabel(summary, alreadyVerified) {
  if (summary?.visited_today) return '✓ Verified today';
  if (summary || alreadyVerified) return "Verify today's visit";
  return 'Verify with a photo';
}

export function didBecomeMayor(beforeSummary, afterSummary) {
  return Boolean(
    beforeSummary &&
      afterSummary?.eligible &&
      !beforeSummary.is_mayor &&
      afterSummary.is_mayor
  );
}

export function mayorshipProgressText(summary) {
  if (!summary) return '';
  // Mayorship is a leaderboard feature. People who have not explicitly
  // joined should get a complete personal visit experience without seeing
  // competition copy or an upsell on every stairway card.
  if (!summary.eligible) return '';
  if (summary.is_mayor) {
    const myVisitCount = Number(summary.my_mayorship_visit_count || 0);
    return `You’re the mayor with ${myVisitCount} verified ${
      myVisitCount === 1 ? 'visit' : 'visits'
    } in the past 30 days.`;
  }
  if (!summary.visits_needed) return '';

  const visitsNeeded = Number(summary.visits_needed);
  return `${visitsNeeded} more verified ${
    visitsNeeded === 1 ? 'visit' : 'visits'
  } ${summary.mayor_visit_count > 0 ? 'to take the lead' : 'to become mayor'}.`;
}
