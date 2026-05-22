'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { useNotifications } from '@/hooks/use-notifications';

function NotificationsList() {
  const { data, isLoading, error, refetch } = useNotifications();
  return (
    <PageShell title="Notifications" subtitle="Updates on issues you follow or reported." isLoading={isLoading} error={error} onRetry={() => refetch()} isEmpty={!data?.length}>
      <div className="space-y-3">
        {(data ?? []).map((n) => (
          <div key={n.id} className="card" style={{ padding: 14, opacity: n.is_read ? 0.75 : 1 }}>
            <div style={{ fontWeight: 600 }}>{n.title}</div>
            {n.body && <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 4 }}>{n.body}</p>}
            <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 6 }}>{n.created_at}</div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export default function NotificationsPage() {
  return (
    <RouteGuard>
      <NotificationsList />
    </RouteGuard>
  );
}
