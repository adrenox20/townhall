'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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

function IssueDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: issue, isLoading: issueLoading, error: issueError } = useIssue(id);
  const { data: comments, isLoading: commentsLoading } = useComments(id);
  const { data: solutions, isLoading: solutionsLoading } = useSolutions(id);
  const { data: timeline, isLoading: timelineLoading } = useTimeline(id);

  const updateStatus = useUpdateIssueStatus();
  const assignIssue = useAssignIssue();
  const voteIssue = useVoteIssue();
  const createComment = useCreateComment();

  const [commentBody, setCommentBody] = useState('');

  const isLoading = issueLoading || commentsLoading || solutionsLoading || timelineLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
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

  // Error state
  if (issueError || !issue) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Icon name="alert" size={32} className="text-[var(--danger)]" />
          <p className="text-lg font-medium">Failed to load issue</p>
          <p className="text-sm text-foreground/60">
            {issueError instanceof Error ? issueError.message : 'The issue could not be found or an error occurred.'}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canUpdateStatus = hasPermission(user, 'issue:status_update');
  const canAssign = hasPermission(user, 'issue:assign');

  function handleStatusChange(newStatus: string) {
    updateStatus.mutate({ id: issue!.id, status: newStatus });
  }

  function handleAssign() {
    if (user) {
      assignIssue.mutate({ id: issue!.id, assignee_id: user.id });
    }
  }

  function handleVote() {
    voteIssue.mutate({ id: issue!.id });
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    createComment.mutate(
      { issueId: issue!.id, body: commentBody.trim() },
      { onSuccess: () => setCommentBody('') }
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      {/* Left column: Issue detail, comments, comment form */}
      <div className="space-y-5">
        {/* Issue header */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{issue.public_id}</Badge>
              <Badge>{statusLabels[issue.status] || issue.status}</Badge>
              <Badge variant="outline">{issue.urgency}</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold">{issue.title}</h1>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/75 whitespace-pre-wrap">{issue.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-foreground/60">
              <span>By {issue.is_anonymous ? 'Anonymous' : issue.author?.name || 'Unknown'}</span>
              <span>·</span>
              <span>{new Date(issue.created_at).toLocaleDateString()}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleVote} disabled={voteIssue.isPending}>
                <Icon name="thumbs-up" size={14} />
                <span className="ml-1">{issue.votes}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments section */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Comments ({comments?.length || 0})</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{comment.author?.name || 'Unknown'}</span>
                    <span className="text-foreground/50">·</span>
                    <span className="text-foreground/50">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground/80">{comment.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/50">No comments yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Comment form */}
        <Card>
          <CardContent>
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <textarea
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                rows={3}
                placeholder="Write a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!commentBody.trim() || createComment.isPending}
                >
                  {createComment.isPending ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right column: Metadata, status controls, timeline, solutions */}
      <div className="space-y-5">
        {/* Issue metadata */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Details</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {/* Status control */}
            {canUpdateStatus && (
              <div>
                <label className="block text-foreground/60 mb-1">Status</label>
                <select
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm"
                  value={issue.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updateStatus.isPending}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{statusLabels[s] || s}</option>
                  ))}
                </select>
              </div>
            )}
            {!canUpdateStatus && (
              <div>
                <span className="text-foreground/60">Status:</span>{' '}
                <span className="font-medium">{statusLabels[issue.status] || issue.status}</span>
              </div>
            )}

            <div>
              <span className="text-foreground/60">Urgency:</span>{' '}
              <span className="font-medium capitalize">{issue.urgency}</span>
            </div>

            <div>
              <span className="text-foreground/60">Category:</span>{' '}
              <span className="font-medium">{issue.category?.name || 'Uncategorized'}</span>
            </div>

            <div>
              <span className="text-foreground/60">Department:</span>{' '}
              <span className="font-medium">{issue.department?.name || 'Unassigned'}</span>
            </div>

            <div>
              <span className="text-foreground/60">Assignee:</span>{' '}
              <span className="font-medium">{issue.assignee?.name || 'Unassigned'}</span>
            </div>

            {/* Assign button */}
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
          </CardContent>
        </Card>

        {/* Solutions section */}
        {solutions && solutions.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Solutions ({solutions.length})</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {solutions.map((solution) => (
                <div key={solution.id} className="border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{solution.author?.name || 'Unknown'}</span>
                    {solution.is_official && <Badge variant="accent">Official</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-foreground/80">{solution.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Timeline</h2>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {timeline && timeline.length > 0 ? (
              timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-2">
                  <Icon name="clock" size={14} className="mt-0.5 text-foreground/40 shrink-0" />
                  <div>
                    <p className="text-foreground/80">{event.summary}</p>
                    <p className="text-xs text-foreground/50">
                      {event.actor?.name || 'System'} · {new Date(event.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-foreground/50">No timeline events yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
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
