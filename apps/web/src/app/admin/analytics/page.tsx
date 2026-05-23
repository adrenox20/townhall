'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { Stat } from '@/components/ui/stat';
import { useAdminAnalytics } from '@/hooks/use-admin';
import { statusLabels } from '@/lib/constants';

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span style={{ color: 'var(--fg)' }}>{label}</span>
        <span style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{count} <span style={{ opacity: 0.5 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-muted)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function AnalyticsContent() {
  const { data, isLoading, error, refetch } = useAdminAnalytics();

  const total = (data?.byStatus ?? []).reduce((s, r) => s + r.count, 0);
  const resolved = (data?.byStatus ?? []).find(r => r.status === 'resolved')?.count ?? 0;
  const open = (data?.byStatus ?? []).find(r => r.status === 'open')?.count ?? 0;
  const inProgress = (data?.byStatus ?? [])
    .filter(r => ['in_progress', 'under_investigation', 'escalated'].includes(r.status))
    .reduce((s, r) => s + r.count, 0);

  const statusColors: Record<string, string> = {
    open: 'var(--info)',
    under_investigation: 'var(--warning)',
    in_progress: 'var(--warning)',
    waiting_for_student_response: 'var(--warning)',
    escalated: 'var(--danger)',
    resolved: 'var(--success)',
    rejected: 'var(--fg-subtle)',
    archived: 'var(--fg-subtle)',
  };

  const categoryColors = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--info)', 'var(--danger)', 'var(--fg-subtle)'];
  const catTotal = (data?.byCategory ?? []).reduce((s, r) => s + r.count, 0);

  return (
    <PageShell title="Analytics" subtitle="Institution metrics from live data." isLoading={isLoading} error={error} onRetry={() => refetch()}>
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" style={{ marginBottom: 24 }}>
        <Stat label="Total issues" value={String(total)} />
        <Stat label="Resolved" value={String(resolved)} delta={total > 0 ? `${Math.round((resolved / total) * 100)}% resolution rate` : ''} deltaDir="up" hint="" />
        <Stat label="In progress" value={String(inProgress)} />
        <Stat label="Open" value={String(open)} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* By status */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Issues by status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data?.byStatus ?? []).filter(row => row.status !== 'pending_review').map(row => (
              <BarRow
                key={row.status}
                label={statusLabels[row.status] ?? row.status}
                count={row.count}
                total={total}
                color={statusColors[row.status] ?? 'var(--accent)'}
              />
            ))}
            {(data?.byStatus ?? []).length === 0 && (
              <p style={{ color: 'var(--fg-subtle)', fontSize: 13 }}>No data yet.</p>
            )}
          </div>
        </div>

        {/* By category */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Issues by category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data?.byCategory ?? []).map((row, i) => (
              <BarRow
                key={row.name}
                label={row.name || 'Uncategorized'}
                count={row.count}
                total={catTotal}
                color={categoryColors[i % categoryColors.length]}
              />
            ))}
            {(data?.byCategory ?? []).length === 0 && (
              <p style={{ color: 'var(--fg-subtle)', fontSize: 13 }}>No data yet.</p>
            )}
          </div>
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
