'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { usePortalDashboard } from '@/hooks/use-portal';
import { Stat } from '@/components/ui/stat';

function PortalDashboard() {
  const { data, isLoading, error, refetch } = usePortalDashboard();
  const total = Number(data?.totals?.total ?? 0);
  const resolved = Number(data?.totals?.resolved ?? 0);
  return (
    <PageShell title="Platform dashboard" subtitle="Cross-institution metrics." isLoading={isLoading} error={error} onRetry={() => refetch()}>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total issues" value={String(total)} />
        <Stat label="Resolved" value={String(resolved)} />
        <Stat label="Escalated" value={String(data?.totals?.escalated ?? 0)} />
      </div>
    </PageShell>
  );
}

export default function PortalPage() {
  return (
    <RouteGuard requiredRole="portal_admin">
      <PortalDashboard />
    </RouteGuard>
  );
}
