'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { useAdminAnalytics } from '@/hooks/use-admin';

function AnalyticsContent() {
  const { data, isLoading, error, refetch } = useAdminAnalytics();
  return (
    <PageShell title="Analytics" subtitle="Institution metrics from live data." isLoading={isLoading} error={error} onRetry={() => refetch()}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card" style={{ padding: 16 }}>
          <h3 className="font-semibold" style={{ marginBottom: 12 }}>By status</h3>
          <ul className="space-y-2 text-sm">
            {(data?.byStatus ?? []).map((row) => (
              <li key={row.status} className="flex justify-between"><span>{row.status}</span><span>{row.count}</span></li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3 className="font-semibold" style={{ marginBottom: 12 }}>By category</h3>
          <ul className="space-y-2 text-sm">
            {(data?.byCategory ?? []).map((row) => (
              <li key={row.name} className="flex justify-between"><span>{row.name || 'Uncategorized'}</span><span>{row.count}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <RouteGuard requiredRole="institution_admin">
      <AnalyticsContent />
    </RouteGuard>
  );
}
