import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { BellPlus, MessageSquare, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { endpoints } from '../lib/api';
import { Badge, priorityClass, statusClass, statusLabels } from '../lib/badges';
import { StatusTimeline } from '../components/StatusTimeline';
import { useAuth } from '../lib/auth';
import { canAccessAdmin } from '../lib/auth';

export function IssueDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['issue', id], queryFn: () => endpoints.issue(id), enabled: Boolean(id) });
  const vote = useMutation({ mutationFn: (value: 1 | -1 | 0) => endpoints.vote(id, value), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issue', id] }) });
  const follow = useMutation({ mutationFn: () => endpoints.follow(id), onSuccess: (data) => toast.success(data.following ? 'Following issue' : 'Unfollowed issue') });
  const comment = useMutation({
    mutationFn: () => endpoints.addComment(id, { body, parent_id: null, is_official_update: false, is_internal_note: false, attachment_keys: [] }),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      toast.success('Comment posted');
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => endpoints.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      toast.success('Inappropriate comment removed');
    },
    onError: (error) => toast.error(error.message)
  });

  const isAdminUser = canAccessAdmin(user?.role);

  if (isLoading) return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-60 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
      <div className="space-y-5">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    </div>
  );
  if (!data) return <div className="panel p-8 text-center text-slate-400">Issue not found.</div>;

  const { issue } = data;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section className="space-y-5">
        {/* Header */}
        <div className="panel p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={statusClass[issue.status]}>{statusLabels[issue.status]}</Badge>
            <Badge className={priorityClass[issue.priority]}>{issue.priority}</Badge>
            {issue.category_name && <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/25">{issue.category_name}</Badge>}
          </div>
          <h1 className="text-xl font-bold text-white font-display">{issue.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => vote.mutate(1)}>
              <ThumbsUp size={14} className="text-indigo-400" /> {issue.upvotes}
            </button>
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => vote.mutate(-1)}>
              <ThumbsDown size={14} />
            </button>
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => follow.mutate()}>
              <BellPlus size={14} /> Follow
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="panel p-6">
          <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-a:text-indigo-400">
            <ReactMarkdown>{issue.description}</ReactMarkdown>
          </div>
        </div>

        {/* Timeline */}
        <div className="panel p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Status Timeline</h2>
          <StatusTimeline status={issue.status} />
        </div>

        {/* Comments */}
        <div className="panel p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <MessageSquare size={16} className="text-indigo-400" /> Comments
          </h2>
          <div className="space-y-3">
            {data.comments.map((item) => (
              <article key={item.id} className={`rounded-lg border p-4 ${
                item.is_official_update
                  ? 'border-indigo-500/30 bg-indigo-500/5'
                  : 'border-white/[0.06] bg-white/[0.02]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-semibold">
                      {(item.author_name ?? 'U')[0]}
                    </div>
                    <span className="text-xs font-medium text-slate-300">{item.author_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.is_official_update ? (
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Official</Badge>
                    ) : null}
                    {isAdminUser && (
                      <button
                        onClick={() => { if (confirm('Remove this inappropriate comment?')) deleteComment.mutate(item.id); }}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete inappropriate comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                  <ReactMarkdown>{item.body}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
          {user && (
            <form className="mt-5" onSubmit={(e: FormEvent) => { e.preventDefault(); comment.mutate(); }}>
              <textarea className="field min-h-24" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment..." required />
              <button className="btn-primary mt-3 text-xs" disabled={comment.isPending}>Post Comment</button>
            </form>
          )}
        </div>
      </section>

      {/* Sidebar */}
      <aside className="space-y-5">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Details</h2>
          <dl className="space-y-3">
            <Meta label="Submitted by" value={issue.author_name ?? 'Anonymous'} />
            <Meta label="Department" value={issue.department ?? 'Unassigned'} />
            <Meta label="Views" value={String(issue.view_count)} />
            <Meta label="Assigned to" value={issue.assigned_to ?? 'Not assigned'} />
          </dl>
        </div>
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-3">History</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.history.map((entry) => (
              <div key={entry.id} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-xs">
                <div className="font-medium text-slate-200">{entry.field}: <span className="text-slate-500">{entry.old_value ?? '—'}</span> → <span className="text-indigo-300">{entry.new_value}</span></div>
                {entry.note && <p className="mt-1 text-slate-400">{entry.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-xs font-medium text-slate-200">{value}</dd>
    </div>
  );
}
