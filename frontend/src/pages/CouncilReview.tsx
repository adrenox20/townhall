import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, ExternalLink, X, Loader2 } from 'lucide-react';
import { endpoints } from '../lib/api';
import { Badge, priorityClass, statusClass, statusLabels } from '../lib/badges';
import type { Issue } from '../lib/types';

const priorities = ['low', 'medium', 'high', 'critical'] as const;
const departments = ['Academic Affairs', 'Facilities', 'Hostel', 'IT Services', 'Student Welfare', 'Library', 'Canteen', 'Sports', 'Security', 'Administration'];

export function CouncilReview() {
  const queryClient = useQueryClient();
  const { data: queue, isLoading } = useQuery({ queryKey: ['councilQueue'], queryFn: endpoints.councilQueue });
  const [panel, setPanel] = useState<Issue | null>(null);
  const [validateForm, setValidateForm] = useState({ priority: 'medium', department: '', council_note: '' });
  const [rejectForm, setRejectForm] = useState({ reason: '' });
  const [mode, setMode] = useState<'validate' | 'reject'>('validate');

  const validateMutation = useMutation({
    mutationFn: () => endpoints.validateIssue(panel!.id, validateForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['councilQueue'] });
      setPanel(null);
      toast.success('Issue validated and forwarded!');
    },
    onError: (e) => toast.error(e.message)
  });

  const rejectMutation = useMutation({
    mutationFn: () => endpoints.rejectIssue(panel!.id, rejectForm.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['councilQueue'] });
      setPanel(null);
      toast.success('Issue rejected');
    },
    onError: (e) => toast.error(e.message)
  });

  const takeReviewMutation = useMutation({
    mutationFn: (id: string) => endpoints.takeReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['councilQueue'] }),
    onError: (e) => toast.error(e.message)
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-12 w-full" />
      {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
    </div>
  );

  const overdue = queue?.filter(i => i.is_overdue) ?? [];
  const normal = queue?.filter(i => !i.is_overdue) ?? [];

  return (
    <div className="space-y-5 relative">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Review Queue</h1>
          <p className="text-sm text-slate-400 mt-1">{queue?.length ?? 0} issues awaiting council review.</p>
        </div>
      </div>

      {overdue.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide">Overdue ({overdue.length})</h2>
          </div>
          {overdue.map(issue => <QueueRow key={issue.id} issue={issue} overdue onReview={() => { setPanel(issue); setMode('validate'); setValidateForm({ priority: 'medium', department: '', council_note: '' }); }} onTake={() => takeReviewMutation.mutate(issue.id)} />)}
        </section>
      )}

      {normal.length > 0 && (
        <section className="space-y-2">
          {overdue.length > 0 && <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-4">Pending ({normal.length})</h2>}
          {normal.map(issue => <QueueRow key={issue.id} issue={issue} onReview={() => { setPanel(issue); setMode('validate'); setValidateForm({ priority: 'medium', department: '', council_note: '' }); }} onTake={() => takeReviewMutation.mutate(issue.id)} />)}
        </section>
      )}

      {(queue?.length === 0) && (
        <div className="panel p-12 text-center">
          <CheckCircle2 size={32} className="text-teal-400 mx-auto mb-3" />
          <p className="text-white font-semibold">Queue is empty!</p>
          <p className="text-sm text-slate-400 mt-1">No issues waiting for council review.</p>
        </div>
      )}

      {/* Validate/Reject Side Panel */}
      {panel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setPanel(null)} />
          <div className="w-full max-w-md bg-[#12141f] border-l border-white/[0.08] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Review Issue</h2>
              <button onClick={() => setPanel(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className={statusClass[panel.status]}>{statusLabels[panel.status]}</Badge>
                  {panel.category_name && <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/25">{panel.category_name}</Badge>}
                  <span className="text-xs text-slate-500">{panel.upvotes} votes</span>
                </div>
                <h3 className="text-sm font-semibold text-white leading-relaxed">{panel.title}</h3>
                <p className="mt-2 text-xs text-slate-400 line-clamp-4">{panel.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Submitted {new Date(panel.created_at).toLocaleDateString()}</span>
                  <Link to={`/issues/${panel.id}`} target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    Full view <ExternalLink size={10} />
                  </Link>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <button onClick={() => setMode('validate')} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${mode === 'validate' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  Validate ✓
                </button>
                <button onClick={() => setMode('reject')} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${mode === 'reject' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  Reject ✗
                </button>
              </div>

              {mode === 'validate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Priority *</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {priorities.map(p => (
                        <button key={p} type="button" onClick={() => setValidateForm(f => ({ ...f, priority: p }))}
                          className={`rounded-lg px-2 py-2 text-xs font-medium border transition-all ${validateForm.priority === p ? priorityClass[p] : 'border-white/[0.08] text-slate-400 hover:border-white/[0.2]'}`}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Department *</label>
                    <select className="field" value={validateForm.department} onChange={e => setValidateForm(f => ({ ...f, department: e.target.value }))}>
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Council Note * (min 10 chars)</label>
                    <textarea className="field min-h-24" value={validateForm.council_note} onChange={e => setValidateForm(f => ({ ...f, council_note: e.target.value }))} placeholder="Why is this issue valid? Where is it being forwarded?" />
                  </div>
                </div>
              )}

              {mode === 'reject' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Rejection Reason * (min 30 chars)</label>
                  <textarea className="field min-h-32" value={rejectForm.reason} onChange={e => setRejectForm({ reason: e.target.value })} placeholder="Explain why this issue cannot be processed. The student will see this message." />
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/[0.06] space-y-2">
              {mode === 'validate' && (
                <button
                  className="btn-primary w-full"
                  disabled={!validateForm.department || validateForm.council_note.length < 10 || validateMutation.isPending}
                  onClick={() => validateMutation.mutate()}
                >
                  {validateMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Validating...</> : '✓ Validate & Forward'}
                </button>
              )}
              {mode === 'reject' && (
                <button
                  className="w-full py-2 px-4 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-colors text-sm font-medium disabled:opacity-50"
                  disabled={rejectForm.reason.length < 30 || rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate()}
                >
                  {rejectMutation.isPending ? <><Loader2 size={14} className="animate-spin inline mr-1" /> Rejecting...</> : '✗ Reject Issue'}
                </button>
              )}
              <button onClick={() => setPanel(null)} className="btn-secondary w-full text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueRow({ issue, overdue, onReview, onTake }: {
  issue: Issue; overdue?: boolean; onReview: () => void; onTake: () => void;
}) {
  const hours = Math.round((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60));
  return (
    <div className={`panel p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${overdue ? 'border-red-500/20 bg-red-500/5' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {overdue && <AlertTriangle size={12} className="text-red-400 shrink-0" />}
          <Badge className={statusClass[issue.status]}>{statusLabels[issue.status]}</Badge>
          {issue.category_name && <span className="text-xs text-slate-500">{issue.category_name}</span>}
          <span className="text-xs text-slate-500">{hours}h ago · {issue.upvotes} votes</span>
        </div>
        <p className="text-sm font-medium text-white line-clamp-1">{issue.title}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {issue.status === 'submitted' && (
          <button onClick={onTake} className="text-xs px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.2] transition-colors">
            Take Review
          </button>
        )}
        <button onClick={onReview} className="btn-primary text-xs px-3 py-1.5">
          Review & Action
        </button>
        <Link to={`/issues/${issue.id}`} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 transition-colors">
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
