'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { statusLabels, statuses } from '@/lib/constants';
import { useIssue, useIssues, useUpdateIssueStatus, useUpdateIssue, useAssignIssue, useVoteIssue, useMergeIssue, useDeleteIssue } from '@/hooks/use-issues';
import type { ApiIssue } from '@/hooks/use-issues';
import { useComments, useCreateComment, useUpdateComment } from '@/hooks/use-comments';
import { useSolutions, useUpdateSolution } from '@/hooks/use-solutions';
import { useTimeline } from '@/hooks/use-timeline';
import { useStaff } from '@/hooks/use-admin';
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

const VISIBLE_STATUSES = statuses;

/* ── Merge Modal ─────────────────────────────────────────────────────────── */
function MergeModal({
  issue,
  onClose,
  onMerge,
  isPending,
}: {
  issue: ApiIssue;
  onClose: () => void;
  onMerge: (targetId: string, reason: string) => void;
  isPending: boolean;
}) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<ApiIssue | null>(null);
  const [reason, setReason] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: results } = useIssues(q.length >= 2 ? { search: q, limit: 10 } : undefined);
  const filtered = (results?.items ?? []).filter(
    i => i.id !== issue.id && i.public_id !== issue.public_id
  );

  // Focus search on open
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-elev)', borderRadius: 16,
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
        width: '100%', maxWidth: 520, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Merge issue</div>
            <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{issue.public_id}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 4, borderRadius: 6 }}
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>
            Mark <strong style={{ color: 'var(--fg)' }}>{issue.public_id}</strong> as a duplicate.
            Students who submitted this issue will be redirected to the target.
          </p>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} />
            <input
              ref={searchRef}
              className="input"
              style={{ paddingLeft: 34 }}
              placeholder="Search issues by title or ID…"
              value={q}
              onChange={e => { setQ(e.target.value); setSelected(null); }}
            />
          </div>

          {/* Selected issue preview */}
          {selected && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--accent-soft)', border: '1px solid color-mix(in oklab, var(--accent) 30%, transparent)',
            }}>
              <Icon name="check-circle" size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.title}</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-soft-fg)', marginTop: 2 }}>{selected.public_id}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', flexShrink: 0 }}
              >
                <Icon name="x" size={13} />
              </button>
            </div>
          )}

          {/* Search results */}
          {!selected && q.length >= 2 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--fg-subtle)', textAlign: 'center' }}>
                  No other issues match &quot;{q}&quot;
                </div>
              ) : (
                filtered.map(i => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => { setSelected(i); setQ(''); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '11px 14px',
                      fontSize: 13, background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)', flexShrink: 0, paddingTop: 2 }}>{i.public_id}</span>
                    <span style={{ fontWeight: 500, lineHeight: 1.35 }}>{i.title}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>
              Reason <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
            </label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="e.g. Same issue reported by multiple students"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>
        </div>

        {/* Modal footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '14px 20px', borderTop: '1px solid var(--border)',
        }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!selected || isPending}
            onClick={() => selected && onMerge(selected.id, reason)}
            style={selected ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
          >
            {isPending ? 'Merging…' : 'Confirm merge'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Modal ────────────────────────────────────────────────────────── */
function DeleteIssueModal({
  issueTitle,
  onClose,
  onConfirm,
  isPending,
}: {
  issueTitle: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-elev)', borderRadius: 16,
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
        width: '100%', maxWidth: 460,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--danger)' }}>Delete issue</div>
            <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 2 }}>This action cannot be undone</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 4, borderRadius: 6 }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>
            You are about to permanently delete{' '}
            <strong style={{ color: 'var(--fg)' }}>&ldquo;{issueTitle}&rdquo;</strong>.
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
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ resize: 'none' }}
              autoFocus
            />
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '14px 20px', borderTop: '1px solid var(--border)',
        }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!reason.trim() || isPending}
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            {isPending ? 'Deleting…' : 'Delete issue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main detail component ─────────────────────────────────────────────────── */
function IssueDetailContent() {
  const { user } = useAuth();
  const { pushToast } = useApp();

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
  const { data: staff } = useStaff();

  const updateStatus = useUpdateIssueStatus();
  const updateIssue = useUpdateIssue();
  const assignIssue = useAssignIssue();
  const voteIssue = useVoteIssue();
  const mergeIssue = useMergeIssue();
  const deleteIssue = useDeleteIssue();
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const updateSolution = useUpdateSolution();

  const [commentBody, setCommentBody] = useState('');
  const [voted, setVoted] = useState(false);
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Moderator inline-edit state
  const [editingIssueField, setEditingIssueField] = useState<'title' | 'description' | null>(null);
  const [editIssueTitle, setEditIssueTitle] = useState('');
  const [editIssueDesc, setEditIssueDesc] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentBody, setEditCommentBody] = useState('');
  const [editingSolutionId, setEditingSolutionId] = useState<string | null>(null);
  const [editSolutionBody, setEditSolutionBody] = useState('');

  useEffect(() => {
    if (issue?.has_voted) setVoted(true);
  }, [issue?.has_voted]);

  const isLoading = issueLoading || commentsLoading || solutionsLoading || timelineLoading;

  if (isLoading) {
    return (
      <div className="detail-layout">
        <div className="space-y-5"><SkeletonCard lines={5} /><SkeletonCard lines={4} /></div>
        <div className="space-y-5"><SkeletonCard lines={3} /><SkeletonCard lines={4} /></div>
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
  const canMerge = hasPermission(user, 'issue:merge');
  const canDeleteAny = hasPermission(user, 'issue:delete_any');
  const canModerate = hasPermission(user, 'comment:moderate') || hasPermission(user, 'issue:update_any');
  const daysOpen = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000);

  function handleStatusChange(newStatus: string) {
    updateStatus.mutate(
      { id: issue!.id, status: newStatus },
      { onSuccess: () => pushToast('Status updated', 'check') }
    );
  }

  function handleAssignTo(assigneeId: string) {
    assignIssue.mutate(
      { id: issue!.id, assignee_id: assigneeId },
      { onSuccess: () => { pushToast('Assigned', 'check'); setShowAssignPicker(false); } }
    );
  }

  function handleVote() {
    if (voted) return;
    voteIssue.mutate({ id: issue!.id }, {
      onSuccess: () => { setVoted(true); pushToast('Upvoted!', 'check'); },
    });
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    createComment.mutate(
      { issueId: issueId, body: commentBody.trim() },
      { onSuccess: () => setCommentBody('') }
    );
  }

  function handleMerge(targetId: string, reason: string) {
    mergeIssue.mutate(
      { id: issue!.id, mergedIssueId: targetId, reason: reason || undefined },
      { onSuccess: () => setShowMergeModal(false) }
    );
  }

  function handleDelete(reason: string) {
    deleteIssue.mutate(
      { id: issue!.id, reason },
      { onSuccess: () => { setShowDeleteModal(false); pushToast('Issue deleted', 'check'); window.location.href = '/issues'; } }
    );
  }

  function startEditIssueTitle() {
    setEditIssueTitle(issue!.title);
    setEditingIssueField('title');
  }
  function startEditIssueDesc() {
    setEditIssueDesc(issue!.description);
    setEditingIssueField('description');
  }
  function saveIssueEdit() {
    const patch = editingIssueField === 'title'
      ? { id: issue!.id, title: editIssueTitle.trim() }
      : { id: issue!.id, description: editIssueDesc.trim() };
    updateIssue.mutate(patch, {
      onSuccess: () => { setEditingIssueField(null); pushToast('Issue updated', 'check'); },
    });
  }

  function startEditComment(id: string, body: string) {
    setEditingCommentId(id);
    setEditCommentBody(body);
  }
  function saveCommentEdit() {
    if (!editingCommentId) return;
    updateComment.mutate({ commentId: editingCommentId, body: editCommentBody.trim() }, {
      onSuccess: () => { setEditingCommentId(null); pushToast('Comment updated', 'check'); },
    });
  }

  function startEditSolution(id: string, body: string) {
    setEditingSolutionId(id);
    setEditSolutionBody(body);
  }
  function saveEditSolution() {
    if (!editingSolutionId) return;
    updateSolution.mutate({ solutionId: editingSolutionId, body: editSolutionBody.trim() }, {
      onSuccess: () => { setEditingSolutionId(null); pushToast('Solution updated', 'check'); },
    });
  }

  return (
    <>
      {/* Merge modal */}
      {showMergeModal && issue && (
        <MergeModal
          issue={issue}
          onClose={() => setShowMergeModal(false)}
          onMerge={handleMerge}
          isPending={mergeIssue.isPending}
        />
      )}

      {/* Delete modal */}
      {showDeleteModal && issue && (
        <DeleteIssueModal
          issueTitle={issue.title}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isPending={deleteIssue.isPending}
        />
      )}

      <div>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12.5, color: 'var(--fg-muted)' }}>
          <Link href="/issues" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }} className="btn btn--ghost btn--sm">
            <Icon name="arrow-left" size={13} />
            All issues
          </Link>
          {issue.category && (
            <>
              <Icon name="chevron-right" size={11} />
              <Badge variant="subtle">{issue.category.name}</Badge>
            </>
          )}
          <span className="mono" style={{ marginLeft: 'auto', color: 'var(--fg-subtle)', fontSize: 12 }}>{issue.public_id}</span>
        </div>

        {/* Title row */}
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
            {canModerate && editingIssueField === 'title' ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="input"
                  style={{ flex: 1, fontSize: 22, fontWeight: 700 }}
                  value={editIssueTitle}
                  onChange={e => setEditIssueTitle(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveIssueEdit(); if (e.key === 'Escape') setEditingIssueField(null); }}
                />
                <Button size="sm" variant="primary" onClick={saveIssueEdit} disabled={updateIssue.isPending}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingIssueField(null)}>Cancel</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <h1 className="page-title" style={{ fontSize: 28, marginBottom: 0, flex: 1 }}>{issue.title}</h1>
                {canModerate && (
                  <button
                    type="button"
                    onClick={startEditIssueTitle}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: '6px 4px', marginTop: 4, borderRadius: 4, flexShrink: 0 }}
                    title="Edit title"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="detail-layout">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Description */}
            <Card>
              <CardContent>
                {canModerate && editingIssueField === 'description' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      className="textarea"
                      rows={6}
                      value={editIssueDesc}
                      onChange={e => setEditIssueDesc(e.target.value)}
                      autoFocus
                      style={{ fontSize: 14, lineHeight: 1.65 }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Button size="sm" variant="ghost" onClick={() => setEditingIssueField(null)}>Cancel</Button>
                      <Button size="sm" variant="primary" onClick={saveIssueEdit} disabled={updateIssue.isPending}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--fg)', whiteSpace: 'pre-wrap', paddingRight: canModerate ? 28 : 0 }}>
                      {issue.description || 'No further description provided.'}
                    </p>
                    {canModerate && (
                      <button
                        type="button"
                        onClick={startEditIssueDesc}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: 4, borderRadius: 4 }}
                        title="Edit description"
                      >
                        <Icon name="edit" size={14} />
                      </button>
                    )}
                  </div>
                )}
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
                            {!!comment.is_official && <Badge variant="accent">Staff</Badge>}
                            <span className="comment-time">{new Date(comment.created_at).toLocaleDateString()}</span>
                            {canModerate && editingCommentId !== comment.id && (
                              <button
                                type="button"
                                onClick={() => startEditComment(comment.id, comment.body)}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: '2px 4px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                                title="Edit comment"
                              >
                                <Icon name="edit" size={12} /> Edit
                              </button>
                            )}
                          </div>
                          {canModerate && editingCommentId === comment.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                              <textarea
                                className="textarea"
                                rows={3}
                                value={editCommentBody}
                                onChange={e => setEditCommentBody(e.target.value)}
                                autoFocus
                                style={{ fontSize: 13 }}
                              />
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                                <Button size="sm" variant="primary" onClick={saveCommentEdit} disabled={updateComment.isPending || !editCommentBody.trim()}>Save</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="comment-text">{comment.body}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                          <Button variant="primary" size="sm" type="submit" disabled={!commentBody.trim() || createComment.isPending}>
                            {createComment.isPending ? 'Posting...' : 'Comment'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Merged duplicates — full info, left column, before Activity */}
            {(issue.merged_issues ?? []).length > 0 && (
              <Card>
                <CardHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="git-merge" size={15} style={{ color: 'var(--fg-muted)' }} />
                    <h2 className="font-semibold" style={{ fontSize: 15 }}>
                      Merged duplicates ({issue.merged_issues!.length})
                    </h2>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                    These issues were marked as duplicates and merged into this one
                  </p>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {issue.merged_issues!.map(m => (
                      <div key={m.id} style={{
                        padding: '14px 16px', borderRadius: 10,
                        background: 'var(--bg-muted)', border: '1px solid var(--border)',
                      }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                          <Icon name="git-merge" size={13} style={{ color: 'var(--fg-subtle)', flexShrink: 0, marginTop: 3 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }}>{m.title}</div>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{m.public_id}</span>
                          </div>
                        </div>
                        {/* Description preview */}
                        {m.description && (
                          <p style={{
                            fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-muted)',
                            margin: '0 0 10px 0',
                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {m.description}
                          </p>
                        )}
                        {/* Meta row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--fg-muted)', flexWrap: 'wrap' }}>
                          {/* Reporter */}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span className="avatar avatar--sm" style={{ background: 'var(--bg-elev)', fontSize: 8 }}>
                              {m.is_anonymous || !m.author_name ? '?' : getInitials(m.author_name)}
                            </span>
                            {m.is_anonymous || !m.author_name ? 'Anonymous' : m.author_name}
                          </span>
                          <span style={{ width: 3, height: 3, borderRadius: 999, background: 'currentColor', opacity: 0.4 }} />
                          {/* Urgency */}
                          <Badge variant={m.urgency === 'critical' ? 'danger' : 'subtle'} style={{ fontSize: 10 }}>{m.urgency}</Badge>
                          <span style={{ width: 3, height: 3, borderRadius: 999, background: 'currentColor', opacity: 0.4 }} />
                          {/* Votes */}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="arrow-up" size={11} />
                            {m.votes ?? 0}
                          </span>
                          {/* Comments */}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="msg" size={11} />
                            {m.comments_count ?? 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                        <div className="timeline-dot"><Icon name="clock" size={11} /></div>
                        <div className="timeline-body">
                          <div className="timeline-text">{event.summary}</div>
                          <div className="timeline-time">
                            {event.actor?.name ?? (event.type === 'issue_created' ? 'Anonymous' : 'System')} · {new Date(event.created_at).toLocaleDateString()}
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
                        {VISIBLE_STATUSES.map((s) => (
                          <button
                            key={s}
                            className={`chip${issue.status === s ? ' active' : ''}`}
                            style={{ justifyContent: 'center', fontSize: 11 }}
                            onClick={() => handleStatusChange(s)}
                            disabled={updateStatus.isPending || issue.status === s}
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

            {/* Details + Assign */}
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

                  <DetailRow label="Category">
                    {issue.category
                      ? <Badge variant="subtle">{issue.category.name}</Badge>
                      : <span style={{ color: 'var(--fg-subtle)', fontSize: 12 }}>None</span>
                    }
                  </DetailRow>

                  <DetailRow label="Urgency">
                    <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{issue.urgency}</span>
                  </DetailRow>

                  <DetailRow label="Open for">
                    <span className="mono" style={{ fontSize: 12.5 }}>
                      {daysOpen === 0 ? 'today' : `${daysOpen}d`}
                    </span>
                  </DetailRow>

                  {/* Assign to… button + dropdown */}
                  {canAssign && (
                    <div style={{ position: 'relative' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        block
                        icon="user-plus"
                        onClick={() => setShowAssignPicker(o => !o)}
                        disabled={assignIssue.isPending}
                      >
                        {assignIssue.isPending ? 'Assigning…' : 'Assign to…'}
                      </Button>
                      {showAssignPicker && (
                        <>
                          {/* Click-outside backdrop */}
                          <div style={{ position: 'fixed', inset: 0, zIndex: 39 }} onClick={() => setShowAssignPicker(false)} />
                          <div className="dropdown" style={{ left: 0, right: 0, minWidth: 'unset', zIndex: 40 }}>
                            <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>
                              Select assignee
                            </div>
                            <button
                              type="button"
                              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              onClick={() => handleAssignTo(user!.id)}
                            >
                              <span className="avatar avatar--sm" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent', fontSize: 9 }}>
                                {getInitials(user?.name ?? '?')}
                              </span>
                              <span>Assign to me</span>
                            </button>
                            {(staff ?? []).filter(s => s.id !== user?.id).map(s => (
                              <button
                                key={s.id}
                                type="button"
                                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                onClick={() => handleAssignTo(s.id)}
                              >
                                <span className="avatar avatar--sm" style={{ background: 'var(--bg-muted)', fontSize: 9 }}>
                                  {getInitials(s.name)}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{s.email}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Merge issue button — moderators and portal admins only */}
                  {canMerge && (
                    <Button
                      variant="outline"
                      size="sm"
                      block
                      icon="git-merge"
                      onClick={() => setShowMergeModal(true)}
                    >
                      Merge issue…
                    </Button>
                  )}

                  {/* Delete issue button — moderators and portal admin */}
                  {canDeleteAny && (
                    <Button
                      variant="outline"
                      size="sm"
                      block
                      icon="trash"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={deleteIssue.isPending}
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                      Delete issue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Solutions */}
            {(solutions ?? []).length > 0 && (
              <Card>
                <CardHeader><h2 className="font-semibold">Solutions ({solutions!.length})</h2></CardHeader>
                <CardContent className="space-y-3">
                  {solutions!.map((solution) => (
                    <div key={solution.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }} className="last:border-0 last:pb-0">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12.5 }}>
                        <span className="avatar avatar--sm" style={{ background: 'var(--bg-muted)', fontSize: 9 }}>
                          {solution.author?.name ? getInitials(solution.author.name) : '?'}
                        </span>
                        <span style={{ fontWeight: 600 }}>{solution.author?.name ?? 'Anonymous'}</span>
                        {!!solution.is_official && <Badge variant="accent">Official</Badge>}
                        {canModerate && editingSolutionId !== solution.id && (
                          <button
                            type="button"
                            onClick={() => startEditSolution(solution.id, solution.body)}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', padding: '2px 4px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                            title="Edit solution"
                          >
                            <Icon name="edit" size={12} /> Edit
                          </button>
                        )}
                      </div>
                      {canModerate && editingSolutionId === solution.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <textarea
                            className="textarea"
                            rows={4}
                            value={editSolutionBody}
                            onChange={e => setEditSolutionBody(e.target.value)}
                            autoFocus
                            style={{ fontSize: 13 }}
                          />
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <Button size="sm" variant="ghost" onClick={() => setEditingSolutionId(null)}>Cancel</Button>
                            <Button size="sm" variant="primary" onClick={saveEditSolution} disabled={updateSolution.isPending || !editSolutionBody.trim()}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg)' }}>{solution.body}</p>
                      )}
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
                    ? <span>Trending — fast-tracked for triage.</span>
                    : issue.votes >= 20
                    ? <span>Strong support. Tagged for review this week.</span>
                    : <span>Help bring this to staff attention by upvoting.</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
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
