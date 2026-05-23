'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIssues, useVoteIssue, useDeleteIssue } from '@/hooks/use-issues';
import type { IssueFilters } from '@/hooks/use-issues';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getHighestRole } from '@/lib/roles';
import { RouteGuard } from '@/components/shared/route-guard';
import { SkeletonTable } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { statusLabels, statuses } from '@/lib/constants';

function IssuesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const role = user ? getHighestRole(user.roles) : 'student';
  const isStaff = role === 'institution_admin' || role === 'portal_admin';
  const canDeleteAny = hasPermission(user, 'issue:delete_any');
  const visibleStatuses = statuses;
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [view, setView] = useState('rows');
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  // Sync search query from URL when navigated from global search bar
  useEffect(() => {
    const urlQ = searchParams.get('q') ?? '';
    setQ(urlQ);
  }, [searchParams]);

  // Build API filter params
  const filters: IssueFilters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(q && { search: q }),
    sort: sortBy,
  };

  const { data, isLoading, isError, error, refetch } = useIssues(filters);
  const issues = data?.items ?? [];
  const voteIssue = useVoteIssue();
  const deleteIssue = useDeleteIssue();
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Seed votedIds from server on each data load (persists across page refresh)
  useEffect(() => {
    const serverVoted = issues.filter(i => i.has_voted).map(i => i.id);
    if (serverVoted.length > 0) {
      setVotedIds(prev => new Set([...prev, ...serverVoted]));
    }
  }, [data]);

  return (
    <RouteGuard>
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div style={{
            background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 440, overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--danger)' }}>Delete issue</div>
              <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 2 }}>This action cannot be undone</div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>
                Deleting <strong style={{ color: 'var(--fg)' }}>&ldquo;{deleteTarget.title}&rdquo;</strong>.
                The author will be notified with your reason.
              </p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>
                  Reason <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="e.g. Abusive language, spam, or duplicate report…"
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  style={{ resize: 'none' }}
                  autoFocus
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!deleteReason.trim() || deleteIssue.isPending}
                onClick={() => {
                  if (!deleteReason.trim() || !deleteTarget) return;
                  deleteIssue.mutate(
                    { id: deleteTarget.id, reason: deleteReason.trim() },
                    { onSuccess: () => setDeleteTarget(null) }
                  );
                }}
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                {deleteIssue.isPending ? 'Deleting…' : 'Delete issue'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">
              All issues{' '}
              {!isLoading && (
                <span style={{ color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)', fontSize: 22 }}>
                  {data?.total ?? issues.length}
                </span>
              )}
            </h1>
            <p className="page-sub">Everything reported across campus. Filter by category or status, or sort by what&apos;s getting the most support.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Segmented
              value={view}
              onChange={setView}
              options={[{ value: 'rows', label: 'Rows' }, { value: 'table', label: 'Table' }]}
            />
            {!isStaff && <Button variant="accent" icon="plus" onClick={() => router.push('/issues/new')}>Report</Button>}
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-wrap">
            <Icon name="search" size={14} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by title or ID..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          {/* All 3 filters in one compact row — flex children grow equally */}
          <div style={{ display: 'flex', gap: 6, width: '100%', marginTop: 4 }}>
            <select className="select" style={{ flex: 1, minWidth: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              {visibleStatuses.map(s => (
                <option key={s} value={s}>{statusLabels[s] || s}</option>
              ))}
            </select>
            <select className="select" style={{ flex: 1, minWidth: 0 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
            </select>
            <select className="select" style={{ flex: 1, minWidth: 0 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="trending">Most upvoted</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 24 }}>
              <SkeletonTable rows={6} columns={5} />
            </div>
          ) : isError ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
              <Icon name="alert" size={32} className="mb-2" />
              <p style={{ marginBottom: 12 }}>Failed to load issues{error instanceof Error ? `: ${error.message}` : '.'}</p>
              <Button variant="outline" icon="swap" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : issues.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
              <Icon name="list" size={32} />
              <p style={{ marginTop: 8 }}>No issues found.</p>
            </div>
          ) : view === 'rows' ? (
            <div>
              {issues.map(issue => (
                <div
                  key={issue.id}
                  className="issue-row"
                  onClick={() => router.push(`/issues/${issue.public_id}`)}
                >
                  <button
                    type="button"
                    className={`upvote${votedIds.has(issue.id) ? ' upvote--active' : ''}`}
                    disabled={votedIds.has(issue.id) || voteIssue.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (votedIds.has(issue.id)) return;
                      voteIssue.mutate({ id: issue.id }, {
                        onSuccess: () => setVotedIds((prev) => new Set([...prev, issue.id])),
                      });
                    }}
                    aria-label={`Upvote: ${issue.votes} votes`}
                  >
                    <Icon name="arrow-up" size={12} stroke={2.4} />
                    <span className="upvote-count">{issue.votes}</span>
                  </button>

                  <div style={{ minWidth: 0 }}>
                    <div className="issue-title">{issue.title}</div>
                    <div className="issue-meta">
                      <span className="mono">{issue.public_id}</span>
                      <span className="dot-sep" />
                      {issue.category && (
                        <>
                          <Badge variant="subtle">{issue.category.name}</Badge>
                          <span className="dot-sep" />
                        </>
                      )}
                      <Icon name="msg" size={11} />
                      <span>{issue.comments_count}</span>
                      <span className="dot-sep" />
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge variant={issue.status}>{statusLabels[issue.status] || issue.status}</Badge>
                    <Badge variant="subtle">{issue.urgency}</Badge>
                    {canDeleteAny && (
                      <button
                        type="button"
                        title="Delete issue (moderator)"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: issue.id, title: issue.title });
                          setDeleteReason('');
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px 4px', borderRadius: 4, opacity: 0.7 }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Title</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 100 }}>Urgency</th>
                  <th style={{ width: 140 }}>Category</th>
                  <th style={{ width: 70 }}>Votes</th>
                  <th style={{ width: 80 }}>Comments</th>
                  <th style={{ width: 100 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue.id} onClick={() => router.push(`/issues/${issue.public_id}`)}>
                    <td><span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{issue.public_id}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{issue.title}</div>
                    </td>
                    <td><Badge variant={issue.status}>{statusLabels[issue.status] || issue.status}</Badge></td>
                    <td><Badge variant="subtle">{issue.urgency}</Badge></td>
                    <td>{issue.category?.name ?? '—'}</td>
                    <td><span className="mono" style={{ fontWeight: 600 }}>{issue.votes}</span></td>
                    <td><span className="mono">{issue.comments_count}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{new Date(issue.created_at).toLocaleDateString()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}

export default function IssuesPage() {
  return (
    <Suspense>
      <IssuesPageContent />
    </Suspense>
  );
}
