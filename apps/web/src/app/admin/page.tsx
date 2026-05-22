'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { useAdminDashboard } from '@/hooks/use-admin';
import { useIssues } from '@/hooks/use-issues';
import { IssueCard } from '@/components/issues/issue-card';
import { Stat } from '@/components/ui/stat';

function AdminOverview() {
  const { data: metrics, isLoading, error, refetch } = useAdminDashboard();
  const { data: recent } = useIssues({ limit: 6, sort: 'created_at' });

  const total = Number(metrics?.totals?.total ?? 0);
  const resolved = Number(metrics?.totals?.resolved ?? 0);

  return (
    <PageShell title="Operational dashboard" subtitle="Queue health, SLA risk, and institution analytics." isLoading={isLoading} error={error} onRetry={() => refetch()}>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total issues" value={String(total)} />
        <Stat label="Resolved" value={String(resolved)} />
        <Stat label="Open statuses" value={String((metrics?.byStatus ?? []).filter((s) => !['resolved', 'archived', 'rejected'].includes(s.status)).reduce((a, b) => a + b.count, 0))} />
        <Stat label="Categories" value={String((metrics?.byCategory ?? []).length)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3" style={{ marginTop: 20 }}>
        {(recent?.items ?? []).map((issue) => (
          <IssueCard key={issue.id} issue={{
            id: issue.id,
            public_id: issue.public_id,
            title: issue.title,
            status: issue.status,
            urgency: issue.urgency,
            department: issue.department?.name,
            category: issue.category?.name,
            votes: issue.votes,
            comments: issue.comments_count,
          }} />
        ))}
      </div>
    </PageShell>
  );
}

export default function AdminPage() {
  return (
    <RouteGuard requiredRole="institution_admin">
      <AdminOverview />
    </RouteGuard>
  );
}
