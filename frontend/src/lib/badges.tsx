import clsx from 'clsx';

export const statusLabels: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  wont_fix: "Won't Fix"
};

export const statusClass: Record<string, string> = {
  submitted: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  under_review: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  accepted: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  in_progress: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  wont_fix: 'bg-red-500/20 text-red-300 border-red-500/30'
};

export const priorityClass: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  high: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  critical: 'bg-red-500/20 text-red-300 border-red-500/30'
};

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border', className)}>
      {children}
    </span>
  );
}
