import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiComment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  visibility: string;
  is_official: boolean;
  is_internal: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: { id: string; name: string; avatar_url: string | null };
}

export function useComments(issueId: string) {
  return useQuery({
    queryKey: ['comments', issueId],
    queryFn: () => api<ApiComment[]>(`/issues/${issueId}/comments`),
    enabled: !!issueId && issueId !== '_',
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, body, is_internal }: { issueId: string; body: string; is_internal?: boolean }) =>
      api<ApiComment>(`/issues/${issueId}/comments`, { method: 'POST', body: JSON.stringify({ body, is_internal }) }),
    onSuccess: (_, { issueId }) => { queryClient.invalidateQueries({ queryKey: ['comments', issueId] }); },
  });
}
