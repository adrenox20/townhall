import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ExternalLink, ChevronDown, ChevronRight, Trash2, Pin, MessageSquare, Loader2 } from 'lucide-react';
import { endpoints } from '../lib/api';
import { Badge, priorityClass, statusClass, statusLabels } from '../lib/badges';
import type { Issue } from '../lib/types';

const ALL_STATUSES = ['submitted','under_council_review','validated','rejected','under_review','accepted','in_progress','resolved','closed','wont_fix'];

export function AdminIssues() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['adminIssues'], queryFn: endpoints.adminIssues });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const filtered = data?.filter(issue => {
    const matchSearch = !search || issue.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || issue.status === statusFilter;
    return matchSearch && matchStatus;
  }) ?? [];

  if (isLoading) return (
    <div className="space-y-5">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-80 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">All Issues</h1>
        <p className="text-sm text-slate-400 mt-1">{data?.length ?? 0} total issues</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="field pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." />
        </div>
        <select className="field w-auto min-w-[170px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{statusLabels[s] ?? s}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(issue => (
          <IssueRow key={issue.id} issue={issue} expanded={expandedIssue === issue.id} onToggle={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="panel p-8 text-center text-sm text-slate-400">
            {search || statusFilter ? 'No issues match your filters.' : 'No issues yet.'}
          </div>
        )}
      </div>
    </div>
  );
}

function IssueRow({ issue, expanded, onToggle }: { issue: Issue; expanded: boolean; onToggle: () => void }) {
  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => endpoints.updateStatus(issue.id, { status, note: `Changed to ${statusLabels[status] ?? status} by admin` }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminIssues'] }); toast.success('Status updated'); },
    onError: (e) => toast.error(e.message)
  });

  const actionableStatuses = ['validated','under_review','accepted','in_progress','resolved','closed','wont_fix'];

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={onToggle}>
        <span className="text-slate-500 shrink-0">{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white line-clamp-1">{issue.title}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Badge className={statusClass[issue.status]}>{statusLabels[issue.status]}</Badge>
          <Badge className={priorityClass[issue.priority]}>{issue.priority}</Badge>
        </div>
        <span className="text-xs text-slate-500 hidden md:inline">{issue.upvotes} votes</span>
        <span className="text-xs text-slate-500 hidden lg:inline">{new Date(issue.created_at).toLocaleDateString()}</span>
        <Link to={`/issues/${issue.id}`} onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-indigo-300 transition-colors">
          <ExternalLink size={14} />
        </Link>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] p-4 bg-white/[0.01] space-y-4">
          {issue.council_note && (
            <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-200">
              SC Note: {issue.council_note}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Change status:</span>
            {actionableStatuses.map(s => (
              <button key={s} onClick={() => statusMutation.mutate({ status: s })} disabled={issue.status === s || statusMutation.isPending}
                className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${issue.status === s ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' : 'text-slate-400 border-white/[0.08] hover:border-white/[0.2] hover:text-white disabled:opacity-40'}`}>
                {statusLabels[s] ?? s}
              </button>
            ))}
            {statusMutation.isPending && <Loader2 size={12} className="animate-spin text-indigo-400" />}
          </div>
          <CommentsPanel issueId={issue.id} />
        </div>
      )}
    </div>
  );
}

function CommentsPanel({ issueId }: { issueId: string }) {
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useQuery({ queryKey: ['issueComments', issueId], queryFn: () => endpoints.issueComments(issueId) });
  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteComment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['issueComments', issueId] }); toast.success('Comment removed'); },
    onError: (e) => toast.error(e.message)
  });
  const pinMutation = useMutation({
    mutationFn: endpoints.pinComment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['issueComments', issueId] }); toast.success('Pin toggled'); }
  });

  if (isLoading) return <div className="flex items-center gap-2 text-xs text-slate-400 py-3"><Loader2 size={12} className="animate-spin" /> Loading comments...</div>;
  if (!comments?.length) return <div className="text-xs text-slate-500 py-2 flex items-center gap-1.5"><MessageSquare size={12} /> No comments.</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
        <MessageSquare size={12} /><span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
      </div>
      {comments.map(comment => (
        <div key={comment.id} className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${comment.is_pinned ? 'border-amber-500/30 bg-amber-500/5' : comment.is_official_update ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-white/[0.05] bg-white/[0.01]'}`}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] text-white font-semibold shrink-0">
            {(comment.author_name ?? 'U')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-slate-200">{comment.author_name ?? 'Unknown'}</span>
              {comment.is_official_update ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">Official</span> : null}
              {comment.is_pinned ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">Pinned</span> : null}
            </div>
            <p className="text-slate-300 line-clamp-3">{comment.body}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => pinMutation.mutate(comment.id)} disabled={pinMutation.isPending} className={`p-1.5 rounded-md transition-colors ${comment.is_pinned ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}>
              <Pin size={12} />
            </button>
            <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(comment.id); }} disabled={deleteMutation.isPending} className="p-1.5 rounded-md text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
