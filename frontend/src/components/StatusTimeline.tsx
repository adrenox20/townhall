import { Check } from 'lucide-react';
import { statusLabels } from '../lib/badges';

const steps = ['submitted', 'under_review', 'accepted', 'in_progress', 'resolved', 'closed'];

export function StatusTimeline({ status }: { status: string }) {
  const current = Math.max(steps.indexOf(status), 0);
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      {steps.map((step, index) => {
        const active = index <= current;
        return (
          <div key={step} className="flex items-center gap-2 sm:flex-col sm:items-start">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
              active
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'border-white/[0.1] bg-white/[0.03] text-slate-500'
            }`}>
              {active ? <Check size={14} /> : index + 1}
            </div>
            <div className={`text-xs font-medium ${active ? 'text-indigo-300' : 'text-slate-500'}`}>
              {statusLabels[step]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
