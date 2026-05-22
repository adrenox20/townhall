import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ApiDepartment {
  id: string;
  name: string;
  slug: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api<ApiCategory[]>('/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => api<ApiDepartment[]>('/departments'),
    staleTime: 5 * 60 * 1000,
  });
}

// Types for API responses
export interface ApiIssue {
  id: string;
  public_id: string;
  title: string;
  description: string;
  summary: string | null;
  category_id: string | null;
  department_id: string | null;
  author_id: string;
  assignee_id: string | null;
  status: string;
  urgency: string;
  priority_score: number;
  visibility: string;
  is_anonymous: boolean;
  is_locked: boolean;
  votes: number;
  comments_count: number;
  sla_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  author?: { id: string; name: string; avatar_url: string | null };
  assignee?: { id: string; name: string; avatar_url: string | null } | null;
  category?: { id: string; name: string; slug: string } | null;
  department?: { id: string; name: string; slug: string } | null;
  tags?: { id: string; name: string; slug: string }[];
}

export interface IssueFilters {
  status?: string;
  category?: string;
  department?: string;
  urgency?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

function buildQuery(params?: IssueFilters): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export function useIssues(params?: IssueFilters) {
  return useQuery({
    queryKey: ['issues', params],
    queryFn: () => api<PaginatedResponse<ApiIssue>>(`/issues${buildQuery(params)}`),
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: ['issues', id],
    queryFn: () => api<ApiIssue>(`/issues/${id}`),
    enabled: !!id && id !== '_',
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string; category_id?: string; department_id?: string; urgency?: string; is_anonymous?: boolean }) =>
      api<{ id: string; public_id: string; similar: unknown[] }>('/issues', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['issues'] }); },
  });
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api<ApiIssue>(`/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', id] });
    },
  });
}

export function useAssignIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignee_id }: { id: string; assignee_id: string }) =>
      api<ApiIssue>(`/issues/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignee_id }) }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', id] });
    },
  });
}

export function useVoteIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api<{ votes: number }>(`/issues/${id}/vote`, { method: 'POST' }),
    onMutate: async ({ id }) => {
      // Optimistic update — increment vote count immediately
      await queryClient.cancelQueries({ queryKey: ['issues', id] });
      const previous = queryClient.getQueryData<ApiIssue>(['issues', id]);
      if (previous) {
        queryClient.setQueryData<ApiIssue>(['issues', id], {
          ...previous,
          votes: (previous.votes ?? 0) + 1,
        });
      }
      return { previous };
    },
    onSuccess: (data, { id }) => {
      // Sync with real server count
      queryClient.setQueryData<ApiIssue>(['issues', id], (old) =>
        old ? { ...old, votes: data.votes } : old
      );
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (_err, { id }, context) => {
      // Roll back on error
      if (context?.previous) {
        queryClient.setQueryData(['issues', id], context.previous);
      }
    },
  });
}
