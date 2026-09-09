export const VERIFIED_VISITS_PAGE_SIZE = 1000;

export async function fetchVerifiedStairwayIds(
  supabase,
  userId,
  pageSize = VERIFIED_VISITS_PAGE_SIZE
) {
  const verifiedIds = new Set();
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('verified_visits')
      .select('stairway_id')
      .eq('user_id', userId)
      .order('stairway_id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) return { data: null, error };

    const page = data || [];
    page.forEach((visit) => verifiedIds.add(visit.stairway_id));
    if (page.length < pageSize) return { data: verifiedIds, error: null };
    from += pageSize;
  }
}
