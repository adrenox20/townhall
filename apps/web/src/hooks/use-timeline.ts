import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiTimelineEvent {
  id: string;
  issue_id: string;
  actor_id: string;
  type: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: { id: string; name: string; avatar_url: string | null };
}

export function useTimeline(issueId: string) {
  return useQuery({
    queryKey: ['timeline', issueId],
    queryFn: () => api<ApiTimelineEvent[]>(`/issues/${issueId}/timeline`),
    enabled: !!issueId && issueId !== '_',
  });
}
