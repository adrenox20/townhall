import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApp } from '@/context/app-context';

export interface ApiSolution {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  status: string;
  is_official: boolean;
  upvotes: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  author?: { id: string; name: string; avatar_url: string | null };
}

export function useSolutions(issueId: string) {
  return useQuery({
    queryKey: ['solutions', issueId],
    queryFn: () => api<ApiSolution[]>(`/issues/${issueId}/solutions`),
    enabled: !!issueId && issueId !== '_',
  });
}

export function useCreateSolution() {
  const queryClient = useQueryClient();
  const { pushToast } = useApp();
  return useMutation({
    mutationFn: ({ issueId, body }: { issueId: string; body: string }) =>
      api<ApiSolution>(`/issues/${issueId}/solutions`, { method: 'POST', body: JSON.stringify({ body }) }),
    onSuccess: (_, { issueId }) => { queryClient.invalidateQueries({ queryKey: ['solutions', issueId] }); },
    onError: (err) => { pushToast(err instanceof Error ? err.message : 'Failed to submit solution', 'alert'); },
  });
}

export function useSelectOfficialSolution() {
  const queryClient = useQueryClient();
  const { pushToast } = useApp();
  return useMutation({
    mutationFn: ({ issueId, solutionId }: { issueId: string; solutionId: string }) =>
      api<void>(`/issues/${issueId}/official-solution`, { method: 'POST', body: JSON.stringify({ solution_id: solutionId }) }),
    onSuccess: (_, { issueId }) => { queryClient.invalidateQueries({ queryKey: ['solutions', issueId] }); },
    onError: (err) => { pushToast(err instanceof Error ? err.message : 'Failed to update official solution', 'alert'); },
  });
}
