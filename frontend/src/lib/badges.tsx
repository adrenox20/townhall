import clsx from 'clsx';

// Full labels — used by council/admin who see the real pipeline
export const statusLabels: Record<string, string> = {
  submitted: 'Submitted',
  under_council_review: 'Council Review',
  validated: 'Validated',
  rejected: 'Rejected',
  under_review: 'Under Review',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  wont_fix: "Won't Fix",
  merged: 'Merged'
};

// Public labels — council layer is invisible to students
export const publicStatusLabels: Record<string, string> = {
  submitted: 'Submitted',
  under_council_review: 'Under Review',
  validated: 'Under Review',
  rejected: 'Closed',
  under_review: 'Under Review',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  wont_fix: "Won't Fix",
  merged: 'Merged'
};

export const statusClass: Record<string, string> = {
  submitted: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  under_council_review: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  validated: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  under_review: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  accepted: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  in_progress: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  wont_fix: 'bg-red-900/30 text-red-400 border-red-800/40',
  merged: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
};

// For students, council states map to a neutral blue "Under Review" style
export const publicStatusClass: Record<string, string> = {
  ...{
    submitted: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    under_council_review: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    validated: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    rejected: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    under_review: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    accepted: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    in_progress: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    resolved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    closed: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    wont_fix: 'bg-red-900/30 text-red-400 border-red-800/40',
    merged: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
  }
};

export const priorityClass: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-300 border-red-500/30'
};

export const solutionStatusClass: Record<string, string> = {
  proposed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  council_recommended: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  being_implemented: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  implemented: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30'
};

export const solutionStatusLabels: Record<string, string> = {
  proposed: 'Proposed',
  council_recommended: '⭐ Recommended',
  being_implemented: '🔧 In Progress',
  implemented: '✅ Implemented',
  rejected: 'Rejected'
};

export const effortLabels: Record<string, string> = {
  quick_fix: 'Quick Fix',
  medium: 'Medium',
  large_project: 'Large Project'
};

export const effortClass: Record<string, string> = {
  quick_fix: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  medium: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  large_project: 'bg-purple-500/15 text-purple-300 border-purple-500/25'
};

export const roleLabels: Record<string, string> = {
  student: 'Student',
  student_council: 'Student Council',
  dept_admin: 'Dept Admin',
  super_admin: 'Super Admin'
};

export const roleClass: Record<string, string> = {
  student: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  student_council: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  dept_admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  super_admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
};

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border', className)}>
      {children}
    </span>
  );
}
