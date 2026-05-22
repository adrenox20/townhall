export function solutionRank(solution: { is_official?: number; status: string; is_pinned?: number; upvotes?: number; helpful_count?: number; created_at: string }) {
  const official = solution.is_official ? 1000 : 0;
  const verified = solution.status === 'verified' || solution.status === 'accepted' ? 250 : 0;
  const pinned = solution.is_pinned ? 100 : 0;
  const votes = (solution.upvotes || 0) * 8 + (solution.helpful_count || 0) * 5;
  const ageHours = Math.max(1, (Date.now() - Date.parse(solution.created_at)) / 36e5);
  const recency = Math.max(0, 20 - ageHours / 24);
  const hiddenPenalty = ['hidden', 'rejected'].includes(solution.status) ? 10000 : 0;
  return official + verified + pinned + votes + recency - hiddenPenalty;
}
