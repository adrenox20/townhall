import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { IssueMetrics } from '@/hooks/use-admin';

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
}

export function usePortalDashboard() {
  return useQuery({
    queryKey: ['portal', 'dashboard'],
    queryFn: () => api<IssueMetrics>('/portal/dashboard'),
  });
}

export function usePortalUsers() {
  return useQuery({
    queryKey: ['portal', 'users'],
    queryFn: () => api<PortalUser[]>('/portal/users'),
  });
}

export function usePortalModeration() {
  return useQuery({
    queryKey: ['portal', 'moderation'],
    queryFn: () => api<Record<string, unknown>[]>('/portal/moderation'),
  });
}

export function usePortalAuditLogs() {
  return useQuery({
    queryKey: ['portal', 'audit'],
    queryFn: () => api<Record<string, unknown>[]>('/portal/audit-logs'),
  });
}
