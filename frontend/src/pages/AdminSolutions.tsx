import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink, CheckCircle2, Wrench, XCircle } from 'lucide-react';
import { endpoints } from '../lib/api';
import { Badge, effortClass, effortLabels, solutionStatusClass, solutionStatusLabels } from '../lib/badges';

export function AdminSolutions() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['adminSolutions'], queryFn: endpoints.adminSolutions });
  const [filter, setFilter] = useState('');

  const implementMutation = useMutation({
    mutationFn: ({ solId, status }: { solId: string; status: string }) => endpoints.implementSolution(solId, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSolutions'] }); toast.success('Solution status updated'); },
    onError: (e) => toast.error(e.message)
  });

  const filtered = data?.filter(s => !filter || s.status === filter) ?? [];

  if (isLoading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-12 w-full" />
      {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Solutions Management</h1>
        <p className="text-sm text-slate-400 mt-1">Manage the implementation of student-proposed solutions.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'council_recommended', 'being_implemented', 'proposed', 'implemented', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === s ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' : 'text-slate-400 border-white/[0.08] hover:border-white/[0.2]'}`}>
            {s ? solutionStatusLabels[s] : 'All'} ({s ? (data?.filter(d => d.status === s).length ?? 0) : (data?.length ?? 0)})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(sol => (
          <div key={sol.id} className={`panel p-4 space-y-3 ${sol.status === 'council_recommended' ? 'border-amber-500/20 bg-amber-500/5' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge className={solutionStatusClass[sol.status]}>{solutionStatusLabels[sol.status]}</Badge>
                  {sol.effort && <Badge className={effortClass[sol.effort]}>{effortLabels[sol.effort]}</Badge>}
                </div>
                <p className="text-sm font-semibold text-white">{sol.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  on: <Link to={`/issues/${sol.issue_id}`} className="text-indigo-400 hover:text-indigo-300">{(sol as any).issue_title}</Link>
                </p>
              </div>
              <span className="text-sm font-semibold text-indigo-300 shrink-0">{sol.upvotes} ↑</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-2">{sol.description}</p>
            {sol.cost_estimate && <p className="text-xs text-slate-500">Cost: {sol.cost_estimate}</p>}
            {sol.council_note && (
              <div className="rounded bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-200">SC: {sol.council_note}</div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">by {(sol as any).author_name}</span>
              <div className="flex items-center gap-2">
                {sol.status !== 'implemented' && sol.status !== 'being_implemented' && (
                  <button onClick={() => implementMutation.mutate({ solId: sol.id, status: 'being_implemented' })} disabled={implementMutation.isPending} className="text-xs px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-slate-400 hover:text-teal-300 hover:border-teal-500/30 transition-colors">
                    <Wrench size={11} className="inline mr-1" />Start
                  </button>
                )}
                {sol.status !== 'implemented' && (
                  <button onClick={() => implementMutation.mutate({ solId: sol.id, status: 'implemented' })} disabled={implementMutation.isPending} className="text-xs px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors">
                    <CheckCircle2 size={11} className="inline mr-1" />Mark Done
                  </button>
                )}
                {sol.status === 'proposed' && (
                  <button onClick={() => implementMutation.mutate({ solId: sol.id, status: 'rejected' })} disabled={implementMutation.isPending} className="text-xs px-2 py-1.5 rounded-lg border border-white/[0.08] text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors">
                    <XCircle size={11} className="inline mr-1" />Reject
                  </button>
                )}
                <Link to={`/issues/${sol.issue_id}`} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 transition-colors">
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="panel p-8 text-center text-sm text-slate-400">No solutions in this category.</div>
        )}
      </div>
    </div>
  );
}
