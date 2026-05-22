import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { statusLabels } from '@/lib/constants';

export interface IssueMetrics {
  totals?: { total?: number; resolved?: number; escalated?: number };
  byStatus?: Array<{ status: string; count: number }>;
  byCategory?: Array<{ name: string; count: number }>;
}

export interface KanbanIssue {
  id: string;
  public_id: string;
  title: string;
  status: string;
  urgency: string;
  assignee_id: string | null;
  sla_due_at: string | null;
  votes?: number;
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api<IssueMetrics>('/admin/dashboard'),
  });
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => api<{ total: number; resolved: number; in_progress: number }>('/analytics/summary'),
  });
}

export function useAdminKanban() {
  return useQuery({
    queryKey: ['admin', 'kanban'],
    queryFn: () => api<KanbanIssue[]>('/admin/kanban'),
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => api<IssueMetrics>('/admin/analytics'),
  });
}

import { statuses } from '@/lib/constants';

export function groupKanbanColumns(issues: KanbanIssue[]) {
  return statuses.map((status) => ({
    status,
    label: statusLabels[status] || status,
    issues: issues.filter((i) => i.status === status),
  }));
}
