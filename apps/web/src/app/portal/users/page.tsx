'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { usePortalUsers } from '@/hooks/use-portal';

function UsersContent() {
  const { data, isLoading, error, refetch } = usePortalUsers();
  return (
    <PageShell title="User management" subtitle="University accounts and roles." isLoading={isLoading} error={error} onRetry={() => refetch()} isEmpty={!data?.length}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Email</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 12 }}>{u.name}</td>
                <td style={{ padding: 12 }}>{u.email}</td>
                <td style={{ padding: 12 }}>{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default function PortalUsersPage() {
  return (
    <RouteGuard requiredRole="portal_admin">
      <UsersContent />
    </RouteGuard>
  );
}
