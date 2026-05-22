'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { usePortalModeration } from '@/hooks/use-portal';

function ModerationContent() {
  const { data, isLoading, error, refetch } = usePortalModeration();
  return (
    <PageShell title="Moderation" subtitle="Reported content queue." isLoading={isLoading} error={error} onRetry={() => refetch()} isEmpty={!data?.length} emptyMessage="Moderation queue is empty.">
      <div className="space-y-3">
        {(data ?? []).map((row) => (
          <div key={String(row.id)} className="card" style={{ padding: 14 }}>
            <pre className="text-xs overflow-auto">{JSON.stringify(row, null, 2)}</pre>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default function PortalModerationPage() {
  return (
    <RouteGuard requiredRole="portal_admin">
      <ModerationContent />
    </RouteGuard>
  );
}
