'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { usePortalAuditLogs } from '@/hooks/use-portal';

const ACTION_META: Record<string, { label: string; icon: string; variant: 'accent' | 'danger' | 'subtle' | 'resolved' }> = {
  'issue.status_update': { label: 'Status changed', icon: 'refresh-cw', variant: 'accent' },
  'issue.assign':        { label: 'Issue assigned', icon: 'user-check', variant: 'accent' },
  'issue.archive':       { label: 'Issue archived', icon: 'archive', variant: 'subtle' },
  'issue.merge':         { label: 'Issue merged', icon: 'git-merge', variant: 'subtle' },
  'user.role_change':    { label: 'Role changed', icon: 'shield', variant: 'danger' },
  'user.suspend':        { label: 'User suspended', icon: 'ban', variant: 'danger' },
  'settings.update':     { label: 'Settings updated', icon: 'settings', variant: 'subtle' },
};

function formatDetails(action: string, details: Record<string, unknown>): string {
  if (action === 'issue.status_update' && details.from && details.to) {
    return `${String(details.from)} → ${String(details.to)}`;
  }
  if (action === 'user.role_change' && details.roleId) {
    return `${details.action ?? 'grant'} ${String(details.roleId).replace('role_', '')}`;
  }
  if (action === 'user.suspend') {
    return details.suspended ? 'Account suspended' : 'Account reactivated';
  }
  const entries = Object.entries(details).filter(([k]) => !['method'].includes(k));
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(' · ');
}

function AuditContent() {
  const { data, isLoading, error, refetch } = usePortalAuditLogs();
  return (
    <PageShell
      title="Audit logs"
      subtitle="Privileged actions across the platform."
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      isEmpty={!data?.length}
      emptyMessage="No privileged actions recorded yet."
    >
      <div className="card" style={{ overflow: 'hidden' }}>
        {(data ?? []).map((log, i) => {
          const meta = ACTION_META[log.action] ?? { label: log.action, icon: 'activity', variant: 'subtle' as const };
          const detail = formatDetails(log.action, log.details ?? {});
          const date = new Date(log.created_at);
          return (
            <div
              key={log.id ?? i}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr auto',
                gap: 12,
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 999,
                background: 'var(--bg-muted)', border: '1px solid var(--border-strong)',
                display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--fg-muted)',
              }}>
                <Icon name={meta.icon} size={11} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  {log.entity_id && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-subtle)' }}>
                      {String(log.entity_id).slice(0, 20)}…
                    </span>
                  )}
                </div>
                {detail && (
                  <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3 }}>{detail}</div>
                )}
                <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Icon name="user" size={10} />
                  <span>{log.actor_name ?? log.actor_email ?? 'System'}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-subtle)', whiteSpace: 'nowrap', textAlign: 'right', lineHeight: 1.4 }}>
                <div>{date.toLocaleDateString()}</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

export default function PortalAuditPage() {
  return (
    <RouteGuard requiredRole="portal_admin">
      <AuditContent />
    </RouteGuard>
  );
}
