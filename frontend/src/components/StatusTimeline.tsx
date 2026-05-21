import { Check, X } from 'lucide-react';

// Full flow — shown to council/admin
const fullFlow = ['submitted', 'validated', 'under_review', 'accepted', 'in_progress', 'resolved', 'closed'];

// Public flow — SC layer hidden; students just see a normal progression
const publicFlow = ['submitted', 'under_review', 'accepted', 'in_progress', 'resolved', 'closed'];

// Map council-internal statuses to their public-visible equivalent position
const publicStatusAlias: Record<string, string> = {
  under_council_review: 'submitted',
  validated: 'under_review',
  rejected: 'closed'
};

const stepActiveColors: Record<string, string> = {
  submitted: 'border-slate-400 bg-slate-600 text-white shadow shadow-slate-500/20',
  validated: 'border-teal-400 bg-teal-600 text-white shadow shadow-teal-500/20',
  under_review: 'border-blue-400 bg-blue-600 text-white shadow shadow-blue-500/20',
  accepted: 'border-violet-400 bg-violet-600 text-white shadow shadow-violet-500/20',
  in_progress: 'border-amber-400 bg-amber-600 text-white shadow shadow-amber-500/20',
  resolved: 'border-emerald-400 bg-emerald-600 text-white shadow shadow-emerald-500/20',
  closed: 'border-zinc-400 bg-zinc-600 text-white shadow shadow-zinc-500/20'
};

const fullStepLabels: Record<string, string> = {
  submitted: 'Submitted',
  validated: 'Validated',
  under_review: 'Under Review',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
};

const publicStepLabels: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
};

interface StatusTimelineProps {
  status: string;
  /** Show the council validation step. Default false = hidden from students. */
  councilView?: boolean;
}

export function StatusTimeline({ status, councilView = false }: StatusTimelineProps) {
  const isTerminal = status === 'rejected' || status === 'wont_fix' || status === 'merged';

  if (isTerminal && !councilView) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-500 bg-zinc-700 shadow shadow-zinc-500/20">
          <X size={14} className="text-white" />
        </div>
        <div className="text-sm font-medium text-zinc-300">Closed</div>
      </div>
    );
  }

  if (isTerminal && councilView) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500 bg-red-700 shadow shadow-red-500/20">
          <X size={14} className="text-white" />
        </div>
        <div className="text-sm font-medium text-red-300 capitalize">{status.replace(/_/g, ' ')}</div>
      </div>
    );
  }

  const flow = councilView ? fullFlow : publicFlow;
  const labels = councilView ? fullStepLabels : publicStepLabels;

  // Resolve the current status to a position in the chosen flow
  const resolvedStatus = councilView ? status : (publicStatusAlias[status] ?? status);
  const currentIndex = Math.max(flow.indexOf(resolvedStatus), 0);

  return (
    <div className="relative">
      <div className="flex items-start gap-0">
        {flow.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all mx-auto ${
                  isActive
                    ? (stepActiveColors[step] ?? 'border-indigo-400 bg-indigo-600 text-white')
                    : 'border-white/[0.1] bg-white/[0.03] text-slate-500'
                }`}>
                  {isActive ? <Check size={12} /> : index + 1}
                </div>
              </div>
              <div className={`mt-1.5 text-[10px] font-medium text-center leading-tight px-0.5 ${
                isCurrent ? 'text-white' : isActive ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {labels[step]}
              </div>
            </div>
          );
        })}
      </div>
      {/* Connector lines */}
      <div className="absolute top-3.5 left-0 right-0 flex pointer-events-none" aria-hidden>
        {flow.slice(0, -1).map((step, index) => (
          <div key={step} className="flex-1 px-3.5">
            <div className={`h-px w-full ${index < currentIndex ? 'bg-indigo-500/50' : 'bg-white/[0.06]'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
