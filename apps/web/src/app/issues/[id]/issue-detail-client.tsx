'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { statusLabels, statuses } from '@/lib/constants';
import { useIssue, useUpdateIssueStatus, useAssignIssue, useVoteIssue } from '@/hooks/use-issues';
import { useComments, useCreateComment } from '@/hooks/use-comments';
import { useSolutions } from '@/hooks/use-solutions';
import { useTimeline } from '@/hooks/use-timeline';
import { RouteGuard } from '@/components/shared/route-guard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SkeletonCard } from '@/components/shared/loading-skeleton';
import { useApp } from '@/context/app-context';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function IssueDetailContent() {
  const { user } = useAuth();
  const { pushToast } = useApp();

  // Static export: useParams() always returns the placeholder '_'.
  // Read the real issue ID from window.location after mount.
  const [issueId, setIssueId] = useState<string>('');
  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const id = parts[parts.length - 1];
    if (id && id !== '_') setIssueId(id);
  }, []);

  const { data: issue, isLoading: issueLoading, error: issueError } = useIssue(issueId);
  const { data: comments, isLoading: commentsLoading } = useComments(issueId);
  const { data: solutions, isLoading: solutionsLoading } = useSolutions(issueId);
  const { data: timeline, isLoading: timelineLoading } = useTimeline(issueId);

  const updateStatus = useUpdateIssueStatus();
  const assignIssue = useAssignIssue();
  const voteIssue = useVoteIssue();
  const createComment = useCreateComment();

  const [commentBody, setCommentBody] = useState('');
  // All useState calls must be before any early returns (Rules of Hooks)
  const [voted, setVoted] = useState(false);

  // Sync voted state from server once issue data arrives
  useEffect(() => {
    if (issue?.has_voted) setVoted(true);
  }, [issue?.has_voted]);

  const isLoading = issueLoading || commentsLoading || solutionsLoading || timelineLoading;

  if (isLoading) {
    return (
      <div className="detail-layout">
        <div className="space-y-5">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={4} />
        </div>
        <div className="space-y-5">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  if (issueError || !issue) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Icon name="alert" size={32} className="text-[var(--danger)]" />
          <p className="text-lg font-medium">Failed to load issue</p>
          <p className="text-sm text-foreground/60">
            {issueError instanceof Error ? issueError.message : 'The issue could not be found.'}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const canUpdateStatus = hasPermission(user, 'issue:status_update');
  const canAssign = hasPermission(user, 'issue:assign');
  const daysOpen = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000);

  function handleStatusChange(newStatus: string) {
    updateStatus.mutate(
      { id: issue!.id, status: newStatus },
      { onSuccess: () => pushToast('Status updated', 'check') }
    );
  }

  function handleAssign() {
    if (user) {
      assignIssue.mutate(
        { id: issue!.id, assignee_id: user.id },
        { onSuccess: () => pushToast('Assigned to you', 'check') }
      );
    }
  }

  function handleVote() {
    if (voted) return;
    voteIssue.mutate(
      { id: issue!.id },
      { onSuccess: () => { setVoted(true); pushToast('Upvoted!', 'check'); } }
    );
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    createComment.mutate(
      { issueId: issueId, body: commentBody.trim() },
      { onSuccess: () => setCommentBody('') }
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12.5, color: 'var(--fg-muted)' }}>
        <Link href="/issues" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }} className="btn btn--ghost btn--sm">
          <Icon name="arrow-left" size={13} />
          All issues
        </Link>
        <Icon name="chevron-right" size={11} />
        {issue.category && <Badge variant="subtle">{issue.category.name}</Badge>}
        <span className="mono" style={{ marginLeft: 'auto', color: 'var(--fg-subtle)', fontSize: 12 }}>{issue.public_id}</span>
      </div>

      {/* Title row: large upvote + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 22 }}>
        <button
          className={`upvote${voted ? ' voted' : ''}`}
          style={{ padding: '10px 12px', minWidth: 56 }}
          onClick={handleVote}
          disabled={voteIssue.isPending || voted}
          aria-label="Upvote this issue"
        >
          <Icon name="arrow-up" size={16} stroke={2.4} />
          <span className="upvote-count" style={{ fontSize: 16 }}>{issue.votes}</span>
          <span style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>votes</span>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ fontSize: 28, marginBottom: 8 }}>{issue.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--fg-muted)', fontSize: 13, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="avatar avatar--sm" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent', fontSize: 9 }}>
                {issue.is_anonymous ? '?' : getInitials(issue.author?.name ?? '?')}
              </span>
              {issue.is_anonymous ? 'Anonymous' : (issue.author?.name ?? 'Unknown')}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--fg-subtle)', opacity: 0.5 }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="clock" size={12} />
              {new Date(issue.created_at).toLocaleDateString()}
            </span>
            <Badge variant={issue.status as never}>{statusLabels[issue.status] || issue.status}</Badge>
            <Badge variant={issue.urgency === 'critical' ? 'danger' : 'subtle'}>{issue.urgency}</Badge>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Description */}
          <Card>
            <CardContent>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>
                {issue.description || 'No further description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Comments ({comments?.length ?? 0})</h2>
            </CardHeader>
            <CardContent>
              <div style={{ marginTop: -8 }}>
                {(comments ?? []).length === 0 ? (
                  <p style={{ color: 'var(--fg-subtle)', fontSize: 13, padding: '8px 0' }}>No comments yet.</p>
                ) : (
                  (comments ?? []).map((comment) => (
                    <div key={comment.id} className="comment">
                      <span className="avatar" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent', fontSize: 10 }}>
                        {getInitials(comment.author?.name ?? '?')}
                      </span>
                      <div className="comment-body">
                        <div className="comment-head">
                          <span className="comment-author">{comment.author?.name ?? 'Unknown'}</span>
                          {comment.is_official && <Badge variant="accent">Staff</Badge>}
                          <span className="comment-time">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="comment-text">{comment.body}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment form */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <form onSubmit={handleSubmitComment}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span className="avatar" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent', fontSize: 10 }}>
                      {getInitials(user?.name ?? '?')}
                    </span>
                    <div style={{ flex: 1 }}>
                      <textarea
                        className="textarea"
                        placeholder={canUpdateStatus ? 'Update students on progress...' : 'Add a comment...'}
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        rows={2}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          type="submit"
                          disabled={!commentBody.trim() || createComment.isPending}
                        >
                          {createComment.isPending ? 'Posting...' : 'Comment'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Activity timeline */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Activity</h2>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Everything that&apos;s happened on this issue</p>
            </CardHeader>
            <CardContent>
              {(timeline ?? []).length === 0 ? (
                <p style={{ color: 'var(--fg-subtle)', fontSize: 13 }}>No activity yet.</p>
              ) : (
                <div className="timeline">
                  {(timeline ?? []).map((event) => (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-dot">
                        <Icon name="clock" size={11} />
                      </div>
                      <div className="timeline-body">
                        <div className="timeline-text">{event.summary}</div>
                        <div className="timeline-time">
                          {event.actor?.name ?? 'System'} · {new Date(event.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status */}
          <Card>
            <CardHeader><h2 className="font-semibold">Status</h2></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>Current</span>
                  <Badge variant={issue.status as never}>{statusLabels[issue.status] || issue.status}</Badge>
                </div>
                {canUpdateStatus && (
                  <div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-subtle)', marginBottom: 6 }}>Move to</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {statuses.map((s) => (
                        <button
                          key={s}
                          className={`chip${issue.status === s ? ' active' : ''}`}
                          style={{ justifyContent: 'center' }}
                          onClick={() => handleStatusChange(s)}
                          disabled={updateStatus.isPending}
                        >
                          {statusLabels[s] || s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><h2 className="font-semibold">Details</h2></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailRow label="Reporter">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className="avatar avatar--sm" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent', fontSize: 9 }}>
                      {issue.is_anonymous ? '?' : getInitials(issue.author?.name ?? '?')}
                    </span>
                    {issue.is_anonymous ? 'Anonymous' : (issue.author?.name ?? 'Unknown')}
                  </span>
                </DetailRow>

                <DetailRow label="Assignee">
                  {issue.assignee ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className="avatar avatar--sm" style={{ background: 'var(--bg-muted)', fontSize: 9 }}>
                        {getInitials(issue.assignee.name)}
                      </span>
                      {issue.assignee.name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--fg-subtle)', fontSize: 12 }}>Unassigned</span>
                  )}
                </DetailRow>

                {issue.category && (
                  <DetailRow label="Category">
                    <Badge variant="subtle">{issue.category.name}</Badge>
                  </DetailRow>
                )}

                <DetailRow label="Urgency">
                  <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{issue.urgency}</span>
                </DetailRow>

                <DetailRow label="Open for">
                  <span className="mono" style={{ fontSize: 12.5 }}>
                    {daysOpen === 0 ? 'today' : `${daysOpen}d`}
                  </span>
                </DetailRow>

                {canAssign && (
                  <Button
                    variant="outline"
                    size="sm"
                    block
                    onClick={handleAssign}
                    disabled={assignIssue.isPending}
                  >
                    {assignIssue.isPending ? 'Assigning...' : 'Assign to me'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Solutions */}
          {(solutions ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Solutions ({solutions!.length})</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {solutions!.map((solution) => (
                  <div key={solution.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }} className="last:border-0 last:pb-0">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12.5 }}>
                      <span className="avatar avatar--sm" style={{ background: 'var(--bg-muted)', fontSize: 9 }}>
                        {getInitials(solution.author?.name ?? '?')}
                      </span>
                      <span style={{ fontWeight: 600 }}>{solution.author?.name ?? 'Unknown'}</span>
                      {solution.is_official && <Badge variant="accent">Official</Badge>}
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg)' }}>{solution.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Supporters */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Supporters ({issue.votes})</h2>
              <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Students who&apos;ve upvoted</p>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                {issue.votes >= 50
                  ? <span><Icon name="trending-up" size={12} /> Trending — fast-tracked for triage.</span>
                  : issue.votes >= 20
                  ? <span>Strong support. Tagged for review this week.</span>
                  : <span>Help bring this to staff attention by upvoting.</span>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11.5, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{children}</span>
    </div>
  );
}

export default function IssueDetailPage() {
  return (
    <RouteGuard>
      <IssueDetailContent />
    </RouteGuard>
  );
}
