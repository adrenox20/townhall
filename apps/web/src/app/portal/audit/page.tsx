'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { usePortalAuditLogs } from '@/hooks/use-portal';

function AuditContent() {
  const { data, isLoading, error, refetch } = usePortalAuditLogs();
  return (
    <PageShell title="Audit logs" subtitle="Privileged actions across the platform." isLoading={isLoading} error={error} onRetry={() => refetch()} isEmpty={!data?.length}>
      <div className="space-y-2">
        {(data ?? []).map((row) => (
          <div key={String(row.id)} className="card" style={{ padding: 12, fontSize: 12 }}>
            <strong>{String(row.action ?? 'event')}</strong> — {String(row.created_at ?? '')}
          </div>
        ))}
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
