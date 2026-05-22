'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getHighestRole } from '@/lib/roles';
import { useIssues } from '@/hooks/use-issues';
import { useAdminDashboard } from '@/hooks/use-admin';
import { RouteGuard } from '@/components/shared/route-guard';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';
import { StatusBadge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { ApiIssue } from '@/hooks/use-issues';

export default function DashboardPage() {
  return (
    <RouteGuard>
      <DashboardContent />
    </RouteGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user ? getHighestRole(user.roles) : 'student';
  const isAdmin = role === 'institution_admin' || role === 'portal_admin';

  // Fetch trending issues (top 5 by votes)
  const { data: trendingData, isLoading: trendingLoading, error: trendingError, refetch: refetchTrending } = useIssues({ sort: 'votes', limit: 5 });

  // Fetch user's own issues (reports for students, assigned for admins)
  const myIssuesParams = isAdmin
    ? { status: 'open', limit: 4 }
    : { limit: 4 };
  const { data: myIssuesData, isLoading: myIssuesLoading, error: myIssuesError, refetch: refetchMyIssues } = useIssues(myIssuesParams);

  // Admin dashboard stats
  const { data: adminData, isLoading: adminLoading, error: adminError, refetch: refetchAdmin } = useAdminDashboard();

  // Fetch open issues count for student stats
  const { data: openIssuesData, isLoading: openLoading } = useIssues({ status: 'open', limit: 1 });

  const isLoading = trendingLoading || myIssuesLoading || (isAdmin && adminLoading) || (!isAdmin && openLoading);
  const hasError = trendingError || myIssuesError || (isAdmin && adminError);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (hasError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 20px', textAlign: 'center' }}>
        <Icon name="alert" size={40} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</h2>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>We couldn&apos;t load your dashboard data. Please try again.</p>
        <Button variant="primary" icon="swap" onClick={() => { refetchTrending(); refetchMyIssues(); if (isAdmin) refetchAdmin(); }}>
          Retry
        </Button>
      </div>
    );
  }

  const trending = trendingData?.items ?? [];
  const myIssues = myIssuesData?.items ?? [];
  const totalOpen = openIssuesData?.total ?? 0;

  // Build stats based on role
  const stats = isAdmin
    ? [
        { label: 'Unassigned queue', value: Number(adminData?.totals?.total ?? 0) - Number(adminData?.totals?.resolved ?? 0), delta: 'Needs triage', deltaDir: '' as const, hint: '' },
        { label: 'Assigned to you', value: myIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length, delta: '', deltaDir: '' as const, hint: '' },
        { label: 'Closed this week', value: Number(adminData?.totals?.resolved ?? 0), delta: 'On track', deltaDir: 'up' as const, hint: '' },
        { label: 'Avg. resolution', value: '—', delta: '', deltaDir: '' as const, hint: '' },
      ]
    : [
        { label: 'Open across campus', value: totalOpen, delta: '', deltaDir: '' as const, hint: '' },
        { label: 'Your reports', value: myIssuesData?.total ?? 0, delta: `${myIssues.filter(i => i.status === 'open' || i.status === 'in_progress').length} active`, deltaDir: '' as const, hint: '' },
        { label: 'Resolved this week', value: String(adminData?.totals?.resolved ?? 0), delta: '', deltaDir: '' as const, hint: '' },
        { label: 'Avg. response', value: '—', delta: '', deltaDir: '' as const, hint: '' },
      ];

  const userName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {isAdmin ? `Good morning, ${userName}.` : `Hey ${userName},`}{' '}
            <span style={{ color: 'var(--fg-subtle)', fontStyle: 'italic' }}>
              {isAdmin ? `${Number(adminData?.totals?.total ?? 0) - Number(adminData?.totals?.resolved ?? 0)} things to look at.` : 'anything broken?'}
            </span>
          </h1>
          <p className="page-sub">
            {isAdmin
              ? "A quick view of what's open, who's working on what, and where to focus today."
              : "What students are saying, and what's been fixed since you last logged in."}
          </p>
        </div>
        {!isAdmin ? (
          <Button variant="accent" icon="plus" onClick={() => router.push('/issues/new')}>Report an issue</Button>
        ) : (
          <Button variant="primary" icon="shield" onClick={() => router.push('/admin/kanban')}>Open triage queue</Button>
        )}
      </div>

      <div className="g g-4" style={{ marginBottom: 22 }}>
        {stats.map((s, i) => <Stat key={i} {...s} />)}
      </div>

      <div className="g g-3">
        <Card
          className="col-2"
          title={isAdmin ? 'Trending right now' : "What's getting upvoted"}
          sub={isAdmin ? 'Issues with the most student support' : 'Show your support so staff prioritise the right things'}
          action={<Button variant="ghost" size="sm" onClick={() => router.push('/issues')} iconRight="chevron-right">View all</Button>}
        >
          <div style={{ margin: '-6px -2px' }}>
            {trending.length === 0 ? (
              <div style={{ padding: '12px 0', color: 'var(--fg-muted)', fontSize: 13 }}>No trending issues yet.</div>
            ) : (
              trending.map(issue => (
                <TrendingIssueRow key={issue.id} issue={issue} onClick={() => router.push(`/issues/${issue.public_id || issue.id}`)} />
              ))
            )}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title={isAdmin ? 'Your queue' : 'Your reports'}
            sub={isAdmin ? 'Assigned to you' : "Issues you've opened"}
          >
            {myIssues.length === 0 ? (
              <div style={{ padding: '12px 0', color: 'var(--fg-muted)', fontSize: 13 }}>Nothing here yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myIssues.slice(0, 4).map(issue => (
                  <div
                    key={issue.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                    onClick={() => router.push(`/issues/${issue.public_id || issue.id}`)}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {issue.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>{issue.public_id || issue.id}</div>
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="This week" sub="Issues opened vs resolved">
            <div style={{ display: 'flex', gap: 24, padding: '8px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{isAdmin ? Number(adminData?.totals?.total ?? 0) : totalOpen}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Open</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{String(adminData?.totals?.resolved ?? 0)}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Resolved</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg)' }}>{'—'}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>In progress</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Compact issue row for the trending section */
function TrendingIssueRow({ issue, onClick }: { issue: ApiIssue; onClick: () => void }) {
  return (
    <div className="issue-row" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="upvote">
        <Icon name="arrow-up" size={12} stroke={2.4} />
        <span className="upvote-count">{issue.votes}</span>
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="issue-title">{issue.title}</div>
        <div className="issue-meta">
          <span className="mono">{issue.public_id || issue.id}</span>
          {issue.category && (
            <>
              <span className="dot-sep" />
              <span>{issue.category.name}</span>
            </>
          )}
          <span className="dot-sep" />
          <Icon name="msg" size={11} />
          <span>{issue.comments_count}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StatusBadge status={issue.status} />
      </div>
    </div>
  );
}
