'use client';

import Link from 'next/link';
import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { useIssues } from '@/hooks/use-issues';
import { StatusBadge } from '@/components/ui/badge';

function AdminIssuesList() {
  const { data, isLoading, error, refetch } = useIssues({ limit: 50 });
  return (
    <PageShell title="Issue queue" subtitle="All institution issues." isLoading={isLoading} error={error} onRetry={() => refetch()} isEmpty={!data?.items?.length}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>ID</th>
              <th style={{ padding: 12 }}>Title</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Urgency</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((issue) => (
              <tr key={issue.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 12 }}><Link href={`/issues/${issue.id}`}>{issue.public_id}</Link></td>
                <td style={{ padding: 12 }}>{issue.title}</td>
                <td style={{ padding: 12 }}><StatusBadge status={issue.status} /></td>
                <td style={{ padding: 12 }}>{issue.urgency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export default function AdminIssuesPage() {
  return (
    <RouteGuard requiredRole="institution_admin">
      <AdminIssuesList />
    </RouteGuard>
  );
}
