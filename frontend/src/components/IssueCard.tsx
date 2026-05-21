import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { Badge, priorityClass, statusClass, statusLabels } from '../lib/badges';
import type { Issue } from '../lib/types';

export function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Link
      to={`/issues/${issue.id}`}
      className="panel block p-5 transition-all duration-200 hover:border-indigo-500/30 hover:-translate-y-0.5 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <Badge className={statusClass[issue.status]}>{statusLabels[issue.status] ?? issue.status}</Badge>
            <Badge className={priorityClass[issue.priority]}>{issue.priority}</Badge>
            {issue.category_name && (
              <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/25">{issue.category_name}</Badge>
            )}
          </div>
          <h3 className="line-clamp-2 text-base font-semibold text-white group-hover:text-indigo-200 transition-colors">
            {issue.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-slate-400 leading-relaxed">{issue.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] text-white font-semibold">
                {(issue.author_name ?? 'A')[0]}
              </div>
              {issue.author_name ?? 'Anonymous'}
            </span>
            <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 text-sm font-semibold text-white">
            <ThumbsUp size={14} className="text-indigo-400" />
            {issue.upvotes}
          </span>
          <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 text-sm text-slate-400">
            <MessageSquare size={14} />
            {issue.comment_count ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
