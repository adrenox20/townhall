import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ThumbsUp, ExternalLink } from 'lucide-react';
import { endpoints } from '../lib/api';
import { statusLabels } from '../lib/badges';
import type { Issue } from '../lib/types';

const columns = ['submitted', 'under_review', 'accepted', 'in_progress', 'resolved'];

const columnColors: Record<string, { border: string; bg: string; dot: string; text: string }> = {
  submitted: { border: 'border-slate-500/30', bg: 'bg-slate-500/5', dot: 'bg-slate-400', text: 'text-slate-300' },
  under_review: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', dot: 'bg-blue-400', text: 'text-blue-300' },
  accepted: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', dot: 'bg-violet-400', text: 'text-violet-300' },
  in_progress: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', dot: 'bg-amber-400', text: 'text-amber-300' },
  resolved: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', dot: 'bg-emerald-400', text: 'text-emerald-300' },
};

export function Pipeline() {
  const { data, isLoading } = useQuery({
    queryKey: ['issues', '?sort=new'],
    queryFn: () => endpoints.issues('?sort=new&limit=100'),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {columns.map(c => <div key={c} className="skeleton h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const issues = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Issue Pipeline</h1>
        <p className="text-sm text-slate-400 mt-1">Track the progress of all campus issues at a glance.</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {columns.map(col => {
          const colors = columnColors[col];
          return (
            <div key={col} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className={`text-xs font-medium ${colors.text}`}>{statusLabels[col]}</span>
              <span className="text-[10px] text-slate-500">({issues.filter(i => i.status === col).length})</span>
            </div>
          );
        })}
      </div>

      {/* Board */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 overflow-x-auto pb-2">
        {columns.map((column) => {
          const colIssues = issues.filter((issue) => issue.status === column);
          const colors = columnColors[column];
          return (
            <div key={column} className={`min-h-[300px] rounded-xl border p-3 ${colors.border} ${colors.bg}`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <h2 className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide flex-1">{statusLabels[column]}</h2>
                <span className="text-[10px] font-medium text-slate-500 bg-white/[0.06] rounded-full px-1.5 py-0.5">{colIssues.length}</span>
              </div>
              <div className="space-y-2">
                {colIssues.slice(0, 15).map((issue) => (
                  <PipelineCard key={issue.id} issue={issue} />
                ))}
                {colIssues.length > 15 && (
                  <p className="text-[10px] text-slate-500 text-center py-1">+{colIssues.length - 15} more</p>
                )}
                {colIssues.length === 0 && (
                  <p className="text-[10px] text-slate-600 text-center py-4">No issues</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({ issue }: { issue: Issue }) {
  return (
    <Link
      to={`/issues/${issue.id}`}
      className="block w-full rounded-lg border border-white/[0.08] bg-[#1a1d2e] p-3 transition-all hover:border-indigo-500/30 hover:-translate-y-0.5 group"
    >
      <div className="text-[11px] font-medium text-white line-clamp-2 leading-relaxed group-hover:text-indigo-200 transition-colors">
        {issue.title}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <ThumbsUp size={9} className="text-indigo-400" />
          <span className="text-indigo-400 font-semibold">{issue.upvotes}</span>
        </span>
        <span className="truncate ml-2">{issue.category_name ?? ''}</span>
      </div>
    </Link>
  );
}
