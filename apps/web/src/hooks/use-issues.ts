import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    enabled: !!id,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string; category_id?: string; department_id?: string; urgency?: string; is_anonymous?: boolean }) =>
      api<ApiIssue>('/issues', { method: 'POST', body: JSON.stringify(data) }),
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', id] });
    },
  });
}
