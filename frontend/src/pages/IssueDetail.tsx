import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  BellPlus, MessageSquare, ThumbsDown, ThumbsUp, Trash2, Lightbulb,
  History, Info, ChevronRight, Star, Wrench, CheckCircle2, X, Search, Merge, Loader2
} from 'lucide-react';
import { endpoints } from '../lib/api';
import {
  Badge, effortClass, effortLabels, priorityClass,
  publicStatusClass, publicStatusLabels,
  solutionStatusClass, solutionStatusLabels, statusClass, statusLabels
} from '../lib/badges';
import { StatusTimeline } from '../components/StatusTimeline';
import { canAccessAdmin, canAccessCouncil, useAuth } from '../lib/auth';
import type { Issue, Solution } from '../lib/types';

type Tab = 'overview' | 'solutions' | 'comments' | 'history';

export function IssueDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [commentBody, setCommentBody] = useState('');
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [solTitle, setSolTitle] = useState('');
  const [solDesc, setSolDesc] = useState('');
  const [solEffort, setSolEffort] = useState('');
  const [solCost, setSolCost] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => endpoints.issue(id),
    enabled: Boolean(id)
  });

  const isAdminUser = canAccessAdmin(user?.role);
  const isCouncilUser = canAccessCouncil(user?.role);

  // Status labels and badge classes depend on role
  const displayLabel = (status: string) =>
    isCouncilUser
      ? (statusLabels[status] ?? status)
      : (publicStatusLabels[status] ?? status);
  const displayClass = (status: string) =>
    isCouncilUser
      ? (statusClass[status] ?? statusClass.submitted)
      : (publicStatusClass[status] ?? publicStatusClass.submitted);

  const vote = useMutation({ mutationFn: (v: 1 | -1 | 0) => endpoints.vote(id, v), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issue', id] }) });
  const follow = useMutation({ mutationFn: () => endpoints.follow(id), onSuccess: (d) => toast.success(d.following ? 'Following issue' : 'Unfollowed') });
  const comment = useMutation({
    mutationFn: () => endpoints.addComment(id, { body: commentBody, parent_id: null, is_official_update: false, is_internal_note: false, attachment_keys: [] }),
    onSuccess: () => { setCommentBody(''); queryClient.invalidateQueries({ queryKey: ['issue', id] }); toast.success('Comment posted'); },
    onError: (e) => toast.error(e.message)
  });
  const deleteComment = useMutation({
    mutationFn: (cid: string) => endpoints.deleteComment(cid),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['issue', id] }); toast.success('Comment removed'); }
  });
  const createSolution = useMutation({
    mutationFn: () => endpoints.createSolution(id, { title: solTitle, description: solDesc, effort: solEffort || undefined, cost_estimate: solCost || undefined }),
    onSuccess: () => {
      setShowSolutionForm(false); setSolTitle(''); setSolDesc(''); setSolEffort(''); setSolCost('');
      queryClient.invalidateQueries({ queryKey: ['issue', id] }); toast.success('Solution proposed!');
    },
    onError: (e) => toast.error(e.message)
  });
  const voteSolution = useMutation({
    mutationFn: ({ solId, value }: { solId: string; value: 1 | -1 | 0 }) => endpoints.voteSolution(solId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issue', id] })
  });
  const recommendSolution = useMutation({
    mutationFn: (solId: string) => endpoints.recommendSolution(solId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['issue', id] }); toast.success('Recommendation updated'); }
  });

  if (isLoading) return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">{[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>
      <div className="space-y-5">{[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}</div>
    </div>
  );

  if (!data) return <div className="panel p-8 text-center text-slate-400">Issue not found.</div>;

  const { issue, solutions } = data;
  const isMerged = Boolean(issue.is_duplicate_of);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Info size={14} /> },
    { id: 'solutions', label: 'Solutions', icon: <Lightbulb size={14} />, count: solutions.length },
    { id: 'comments', label: 'Comments', icon: <MessageSquare size={14} />, count: data.comments.length },
    { id: 'history', label: 'History', icon: <History size={14} /> }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section className="space-y-5">
        {/* Merged notice */}
        {isMerged && (
          <div className="rounded-xl border border-zinc-500/30 bg-zinc-500/10 p-4 text-sm flex items-center gap-3">
            <Merge size={16} className="text-zinc-400 shrink-0" />
            <span className="text-slate-300">
              This issue was merged.{' '}
              <Link to={`/issues/${issue.is_duplicate_of}`} className="text-indigo-400 hover:text-indigo-300 underline">
                View the consolidated issue →
              </Link>
            </span>
          </div>
        )}

        {/* Header */}
        <div className="panel p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={displayClass(issue.status)}>{displayLabel(issue.status)}</Badge>
            <Badge className={priorityClass[issue.priority]}>{issue.priority.toUpperCase()}</Badge>
            {issue.category_name && <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/25">{issue.category_name}</Badge>}
            {issue.department && <Badge className="bg-slate-500/15 text-slate-300 border-slate-500/25">{issue.department}</Badge>}
          </div>
          <h1 className="text-xl font-bold text-white font-display">{issue.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => vote.mutate(1)}>
              <ThumbsUp size={14} className="text-indigo-400" /> {issue.upvotes}
            </button>
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => vote.mutate(-1)}>
              <ThumbsDown size={14} />
            </button>
            {user && (
              <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => follow.mutate()}>
                <BellPlus size={14} /> Follow
              </button>
            )}
            {/* Appeal — only when rejected AND student is the author */}
            {issue.status === 'rejected' && issue.appeal_allowed && user?.id === issue.author_id && (
              <Link to={`/issues/${id}/appeal`} className="btn-secondary text-xs px-3 py-1.5 text-amber-300 border-amber-500/30 hover:bg-amber-500/10">
                Appeal <ChevronRight size={12} />
              </Link>
            )}
            {/* Merge — council/admin only, internal tool */}
            {isCouncilUser && !isMerged && !['closed', 'rejected'].includes(issue.status) && (
              <button className="btn-secondary text-xs px-3 py-1.5 text-zinc-400 hover:text-white" onClick={() => setShowMergeModal(true)}>
                <Merge size={13} /> Merge
              </button>
            )}
          </div>
        </div>

        {/* Council note — only visible to council/admin, never to students */}
        {isCouncilUser && issue.council_note && (
          <div className="panel p-4 border-teal-500/20 bg-teal-500/5">
            <p className="text-[10px] font-semibold text-teal-400 uppercase tracking-wide mb-1">Internal Council Note</p>
            <p className="text-sm text-slate-300 leading-relaxed">{issue.council_note}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all flex-1 justify-center ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/[0.06]'}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="panel p-6 space-y-5">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-a:text-indigo-400">
              <ReactMarkdown>{issue.description}</ReactMarkdown>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Status Timeline</h3>
              {/* council/admin see the SC validation step; students see the simplified timeline */}
              <StatusTimeline status={issue.status} councilView={isCouncilUser} />
            </div>
          </div>
        )}

        {/* ── Solutions ── */}
        {activeTab === 'solutions' && (
          <div className="space-y-4">
            {solutions.map((sol) => (
              <SolutionCard key={sol.id} solution={sol} isCouncil={isCouncilUser} isAdmin={isAdminUser}
                onVote={(v) => voteSolution.mutate({ solId: sol.id, value: v })}
                onRecommend={() => recommendSolution.mutate(sol.id)} />
            ))}
            {solutions.length === 0 && (
              <div className="panel p-8 text-center">
                <Lightbulb size={24} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No solutions yet. Be the first!</p>
              </div>
            )}
            {user && !showSolutionForm && (
              <button className="btn-secondary w-full" onClick={() => setShowSolutionForm(true)}>
                <Lightbulb size={14} /> Propose a Solution
              </button>
            )}
            {user && showSolutionForm && (
              <div className="panel p-5 space-y-4 border-indigo-500/20">
                <h3 className="text-sm font-semibold text-white">Propose a Solution</h3>
                <input className="field" value={solTitle} onChange={e => setSolTitle(e.target.value)} placeholder="Solution title (min 5 chars)" />
                <textarea className="field min-h-24" value={solDesc} onChange={e => setSolDesc(e.target.value)} placeholder="Describe your solution..." />
                <div className="grid grid-cols-2 gap-3">
                  <select className="field" value={solEffort} onChange={e => setSolEffort(e.target.value)}>
                    <option value="">Effort level</option>
                    <option value="quick_fix">Quick Fix</option>
                    <option value="medium">Medium</option>
                    <option value="large_project">Large Project</option>
                  </select>
                  <input className="field" value={solCost} onChange={e => setSolCost(e.target.value)} placeholder="Cost estimate (optional)" />
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1 text-xs" disabled={createSolution.isPending || !solTitle || !solDesc} onClick={() => createSolution.mutate()}>
                    {createSolution.isPending ? 'Submitting...' : 'Submit Solution'}
                  </button>
                  <button className="btn-secondary text-xs" onClick={() => setShowSolutionForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Comments ── */}
        {activeTab === 'comments' && (
          <div className="panel p-6 space-y-4">
            {data.comments.map((item) => (
              <article key={item.id} className={`rounded-lg border p-4 ${item.is_official_update ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-semibold">
                      {(item.author_name ?? 'U')[0]}
                    </div>
                    <span className="text-xs font-medium text-slate-300">{item.author_name}</span>
                    <span className="text-[10px] text-slate-600">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.is_official_update ? <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Official</Badge> : null}
                    {isAdminUser && (
                      <button onClick={() => { if (confirm('Remove comment?')) deleteComment.mutate(item.id); }} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
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
            {data.comments.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No comments yet.</p>}
            {user && (
              <form onSubmit={(e: FormEvent) => { e.preventDefault(); comment.mutate(); }}>
                <textarea className="field min-h-24" value={commentBody} onChange={e => setCommentBody(e.target.value)} placeholder="Add a comment..." required />
                <button className="btn-primary mt-3 text-xs" disabled={comment.isPending}>Post Comment</button>
              </form>
            )}
          </div>
        )}

        {/* ── History — council/admin see real field names; students see cleaned version ── */}
        {activeTab === 'history' && (
          <div className="panel p-6 space-y-2">
            {data.history.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No history yet.</p>}
            {data.history
              .filter(entry => isCouncilUser || !['council_note', 'council_reviewer_id', 'council_reviewed_at'].includes(entry.field))
              .map((entry) => (
                <div key={entry.id} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-xs">
                  <div className="font-medium text-slate-200">
                    {isCouncilUser ? entry.field : entry.field.replace('merged_into', 'merged')}: <span className="text-slate-500">{entry.old_value ?? '—'}</span> → <span className="text-indigo-300">{entry.new_value}</span>
                  </div>
                  {entry.note && <p className="mt-1 text-slate-400">{entry.note}</p>}
                  <p className="mt-1 text-slate-600">{entry.changed_by_name} · {new Date(entry.created_at).toLocaleString()}</p>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Sidebar */}
      <aside className="space-y-5">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Details</h2>
          <dl className="space-y-3">
            <Meta label="Author" value={issue.author_name ?? 'Anonymous'} />
            <Meta label="Department" value={issue.department ?? 'Unassigned'} />
            <Meta label="Views" value={String(issue.view_count)} />
            <Meta label="Solutions" value={String(issue.solution_count ?? 0)} />
            {issue.assigned_to && <Meta label="Assigned to" value={issue.assigned_to} />}
            <Meta label="Submitted" value={new Date(issue.created_at).toLocaleDateString()} />
          </dl>
        </div>
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Tags</h2>
          {data.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map(tag => (
                <span key={tag.id} className="rounded-full bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 text-xs text-slate-300">#{tag.name}</span>
              ))}
            </div>
          ) : <p className="text-xs text-slate-500">No tags</p>}
        </div>
      </aside>

      {/* Merge modal — only rendered for council/admin */}
      {showMergeModal && isCouncilUser && (
        <MergeModal issueId={id} issueTitle={issue.title} onClose={() => setShowMergeModal(false)} onMerged={() => { setShowMergeModal(false); queryClient.invalidateQueries({ queryKey: ['issue', id] }); navigate(`/issues/${id}`); }} />
      )}
    </div>
  );
}

// ─── Merge Modal ─────────────────────────────────────────────────────────────

function MergeModal({ issueId, issueTitle, onClose, onMerged }: {
  issueId: string; issueTitle: string; onClose: () => void; onMerged: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Issue | null>(null);
  const [note, setNote] = useState('');

  const { data: results, isLoading: searching } = useQuery({
    queryKey: ['issueSearch', search],
    queryFn: () => endpoints.issues(`?search=${encodeURIComponent(search)}&limit=8`),
    enabled: search.trim().length >= 2
  });

  const mergeMutation = useMutation({
    mutationFn: () => endpoints.mergeIssue(issueId, { merge_into: selected!.id, note }),
    onSuccess: () => { toast.success('Issues merged'); onMerged(); },
    onError: (e) => toast.error(e.message)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#12141f] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Merge size={16} className="text-zinc-400" />
            <h2 className="text-sm font-semibold text-white">Merge Issue</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-slate-400">
            Merging will close <span className="text-white font-medium">"{issueTitle}"</span> and redirect followers to the target issue. This is irreversible.
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Search for the canonical issue</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="field pl-9" value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }} placeholder="Type to search issues..." />
            </div>
          </div>

          {/* Results */}
          {searching && <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" /> Searching...</div>}
          {results && results.items.length > 0 && !selected && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.items.filter(i => i.id !== issueId).map(issue => (
                <button key={issue.id} onClick={() => setSelected(issue)}
                  className="w-full text-left rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-colors">
                  <p className="text-xs font-medium text-white line-clamp-1">{issue.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{issue.status} · {issue.upvotes} votes</p>
                </button>
              ))}
            </div>
          )}
          {results && results.items.filter(i => i.id !== issueId).length === 0 && search.length >= 2 && !searching && (
            <p className="text-xs text-slate-500">No matching issues found.</p>
          )}

          {/* Selected target */}
          {selected && (
            <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold text-teal-400 uppercase tracking-wide mb-0.5">Merging into</p>
                  <p className="text-sm font-medium text-white">{selected.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{selected.status} · {selected.upvotes} votes</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded text-slate-500 hover:text-white shrink-0">
                  <X size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Merge note */}
          {selected && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Reason for merge * (min 10 chars)</label>
              <textarea className="field min-h-20" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Same underlying issue about hostel water supply, merging to consolidate votes and discussion." />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2">
          <button
            className="btn-primary flex-1"
            disabled={!selected || note.length < 10 || mergeMutation.isPending}
            onClick={() => mergeMutation.mutate()}
          >
            {mergeMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Merging...</> : <><Merge size={14} /> Confirm Merge</>}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Solution Card ────────────────────────────────────────────────────────────

function SolutionCard({ solution, isCouncil, isAdmin, onVote, onRecommend }: {
  solution: Solution; isCouncil: boolean; isAdmin: boolean;
  onVote: (v: 1 | -1 | 0) => void; onRecommend: () => void;
}) {
  const queryClient = useQueryClient();
  const implementMutation = useMutation({
    mutationFn: (status: string) => endpoints.implementSolution(solution.id, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['issue'] }); toast.success('Solution status updated'); },
    onError: (e) => toast.error(e.message)
  });

  const isRecommended = solution.status === 'council_recommended';
  const isImplemented = solution.status === 'implemented';
  const isBeingImpl = solution.status === 'being_implemented';

  return (
    <div className={`panel p-5 space-y-3 transition-all ${isRecommended ? 'border-amber-500/30 bg-amber-500/5' : isImplemented ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className={solutionStatusClass[solution.status]}>{solutionStatusLabels[solution.status]}</Badge>
            {solution.effort && <Badge className={effortClass[solution.effort]}>{effortLabels[solution.effort]}</Badge>}
          </div>
          <h3 className="text-sm font-semibold text-white">{solution.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => onVote(1)}>
            <ThumbsUp size={12} /> {solution.upvotes}
          </button>
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => onVote(-1)}>
            <ThumbsDown size={12} /> {solution.downvotes}
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{solution.description}</p>

      {solution.cost_estimate && (
        <p className="text-xs text-slate-400">Cost: <span className="text-slate-200">{solution.cost_estimate}</span></p>
      )}
      {/* Council note on solution is also internal-only */}
      {isCouncil && solution.council_note && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
          SC Note: {solution.council_note}
        </div>
      )}
      {solution.admin_note && (
        <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-200">
          Admin Note: {solution.admin_note}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">by {solution.author_name}</span>
        <div className="flex items-center gap-1.5">
          {isCouncil && (
            <button onClick={onRecommend} className={`text-xs px-2 py-1 rounded-lg border transition-colors ${isRecommended ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'text-slate-400 border-white/[0.08] hover:text-amber-300 hover:border-amber-500/30'}`}>
              <Star size={11} className="inline mr-1" />{isRecommended ? 'Unrecommend' : 'Recommend'}
            </button>
          )}
          {isAdmin && !isImplemented && (
            <>
              {!isBeingImpl && (
                <button onClick={() => implementMutation.mutate('being_implemented')} className="text-xs px-2 py-1 rounded-lg border border-white/[0.08] text-slate-400 hover:text-teal-300 hover:border-teal-500/30 transition-colors">
                  <Wrench size={11} className="inline mr-1" />Start
                </button>
              )}
              <button onClick={() => implementMutation.mutate('implemented')} className="text-xs px-2 py-1 rounded-lg border border-white/[0.08] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors">
                <CheckCircle2 size={11} className="inline mr-1" />Done
              </button>
            </>
          )}
        </div>
      </div>
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
