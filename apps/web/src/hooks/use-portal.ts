import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApp } from '@/context/app-context';
import type { IssueMetrics } from '@/hooks/use-admin';

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
  roles: string[];
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
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
    staleTime: 30 * 1000,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { pushToast } = useApp();
  return useMutation({
    mutationFn: ({ userId, roleId, action }: { userId: string; roleId: string; action: 'grant' | 'revoke' }) =>
      api<{ updated: boolean }>(`/portal/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleId, action }),
      }),
    onSuccess: (_, { action, roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'users'] });
      pushToast(`Role ${action === 'grant' ? 'granted' : 'revoked'}: ${roleId.replace('role_', '')}`, 'check');
    },
    onError: (err) => pushToast(err instanceof Error ? err.message : 'Failed to update role', 'alert'),
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
    queryFn: () => api<AuditLog[]>('/portal/audit-logs'),
    staleTime: 60 * 1000,
  });
}
