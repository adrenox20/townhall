'use client';

import { RouteGuard } from '@/components/shared/route-guard';
import { PageShell } from '@/components/shared/page-shell';
import { Badge } from '@/components/ui/badge';
import { usePortalModeration } from '@/hooks/use-portal';

function ModerationContent() {
  const { data, isLoading, error, refetch } = usePortalModeration();
  return (
    <PageShell
      title="Moderation"
      subtitle="Reported content queue."
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      isEmpty={!data?.length}
      emptyMessage="Moderation queue is empty."
    >
      <div className="space-y-3">
        {(data ?? []).map((row, i) => {
          const id = String(row.id ?? i);
          const typeStr = row.type != null ? String(row.type ?? row.report_type ?? row.kind) : null;
          const statusStr = row.status != null ? String(row.status ?? row.state) : null;
          const reasonStr = row.reason != null ? String(row.reason ?? row.content ?? row.description) : null;
          const reporterStr = row.reporter_name != null ? String(row.reporter_name ?? row.reporter_email ?? row.reporter_id) : null;
          const targetStr = row.target_id != null ? String(row.target_id ?? row.issue_id ?? row.comment_id) : null;
          const createdAt = row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : null;

          return (
            <div key={id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {typeStr && <Badge variant="subtle">{typeStr}</Badge>}
                {statusStr && <Badge variant={statusStr === 'resolved' ? 'resolved' : statusStr === 'pending' ? 'pending_review' : ''}>{statusStr}</Badge>}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>{id}</span>
              </div>

              {reasonStr && (
                <p style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.5, color: 'var(--fg)' }}>
                  {reasonStr}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--fg-subtle)' }}>
                {reporterStr && (
                  <span>Reporter: <span style={{ color: 'var(--fg)' }}>{reporterStr}</span></span>
                )}
                {targetStr && (
                  <span>Target: <span style={{ color: 'var(--fg)', fontFamily: 'var(--font-mono)' }}>{targetStr}</span></span>
                )}
                {createdAt && <span>{createdAt}</span>}
              </div>
            </div>
          );
        })}
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
