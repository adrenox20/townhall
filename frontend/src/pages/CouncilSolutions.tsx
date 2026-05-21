import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { endpoints } from '../lib/api';
import { Badge, effortClass, effortLabels, solutionStatusClass, solutionStatusLabels } from '../lib/badges';
import type { Solution } from '../lib/types';

export function CouncilSolutions() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['adminSolutions'], queryFn: endpoints.adminSolutions });
  const [filter, setFilter] = useState('');

  const recommendMutation = useMutation({
    mutationFn: (solId: string) => endpoints.recommendSolution(solId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminSolutions'] }); toast.success('Recommendation updated'); },
    onError: (e) => toast.error(e.message)
  });

  const filtered = data?.filter(s =>
    !filter || s.status === filter
  ) ?? [];

  if (isLoading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-12 w-full" />
      {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Solutions Review</h1>
        <p className="text-sm text-slate-400 mt-1">Review and recommend the best student-proposed solutions.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'proposed', 'council_recommended', 'being_implemented', 'implemented'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${filter === s ? 'bg-teal-600/20 text-teal-300 border-teal-500/30' : 'text-slate-400 border-white/[0.08] hover:border-white/[0.2]'}`}>
            {s ? solutionStatusLabels[s] : 'All Solutions'} {s ? `(${data?.filter(d => d.status === s).length ?? 0})` : `(${data?.length ?? 0})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(sol => (
          <SolutionRow key={sol.id} solution={sol} onRecommend={() => recommendMutation.mutate(sol.id)} recommending={recommendMutation.isPending} />
        ))}
        {filtered.length === 0 && (
          <div className="panel p-8 text-center text-sm text-slate-400">No solutions in this category.</div>
        )}
      </div>
    </div>
  );
}

function SolutionRow({ solution, onRecommend, recommending }: {
  solution: Solution & { issue_title: string }; onRecommend: () => void; recommending: boolean;
}) {
  const isRecommended = solution.status === 'council_recommended';
  return (
    <div className={`panel p-4 space-y-2 ${isRecommended ? 'border-amber-500/20 bg-amber-500/5' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className={solutionStatusClass[solution.status]}>{solutionStatusLabels[solution.status]}</Badge>
            {solution.effort && <Badge className={effortClass[solution.effort]}>{effortLabels[solution.effort]}</Badge>}
          </div>
          <p className="text-sm font-semibold text-white">{solution.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            on: <Link to={`/issues/${solution.issue_id}`} className="text-indigo-400 hover:text-indigo-300">{(solution as any).issue_title}</Link>
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          <span className="text-indigo-300 font-semibold flex items-center gap-1"><ThumbsUp size={11} /> {solution.upvotes}</span>
          <span className="text-slate-500 flex items-center gap-1"><ThumbsDown size={11} /> {solution.downvotes}</span>
        </div>
      </div>
      <p className="text-xs text-slate-300 line-clamp-2">{solution.description}</p>
      {solution.cost_estimate && <p className="text-xs text-slate-500">Cost: {solution.cost_estimate}</p>}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">by {(solution as any).author_name}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onRecommend}
            disabled={recommending}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${isRecommended ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/10' : 'text-slate-400 border-white/[0.08] hover:text-amber-300 hover:border-amber-500/30'}`}
          >
            <Star size={11} className="inline mr-1" />{isRecommended ? 'Unrecommend' : 'Recommend'}
          </button>
          <Link to={`/issues/${solution.issue_id}`} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 transition-colors">
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
