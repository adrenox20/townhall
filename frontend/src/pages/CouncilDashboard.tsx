import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, ClipboardList, ChevronRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { endpoints } from '../lib/api';
import { IssueCard } from '../components/IssueCard';

export function CouncilDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['councilStats'], queryFn: endpoints.councilStats });
  const { data: queue, isLoading: queueLoading } = useQuery({ queryKey: ['councilQueue'], queryFn: endpoints.councilQueue });

  if (statsLoading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );

  const overdue = queue?.filter(i => i.is_overdue) ?? [];
  const pending = queue?.filter(i => !i.is_overdue) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Student Council Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Review and validate campus issues before they reach department admins.</p>
        </div>
        <Link to="/council/review" className="btn-primary text-sm">
          <ClipboardList size={16} /> Review Queue ({stats?.pending ?? 0})
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Kpi icon={<ClipboardList size={20} />} label="Pending Review" value={stats?.pending ?? 0} color="indigo" />
        <Kpi icon={<AlertTriangle size={20} />} label="Overdue >48hr" value={stats?.overdue ?? 0} color="red" highlight={Boolean(stats?.overdue)} />
        <Kpi icon={<CheckCircle size={20} />} label="Validated (Week)" value={stats?.validatedThisWeek ?? 0} color="teal" />
        <Kpi icon={<Clock size={20} />} label="Avg Review (hrs)" value={stats?.avgReviewHours ?? 0} color="amber" />
        <Kpi icon={<AlertTriangle size={20} />} label="Rejection Rate" value={`${stats?.rejectionRate ?? 0}%`} color="slate" />
      </div>

      {/* Submission trend */}
      {stats?.submissionTrend && stats.submissionTrend.length > 0 && (
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Submissions (Last 14 Days)</h2>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={stats.submissionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Overdue queue */}
      {overdue.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-red-300">{overdue.length} Overdue — Awaiting review for &gt;48 hours</h2>
          </div>
          {overdue.slice(0, 5).map(issue => (
            <div key={issue.id} className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
              <IssueCard issue={issue} councilView />
            </div>
          ))}
        </section>
      )}

      {/* Next up */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Up Next ({pending.length})</h2>
          {pending.slice(0, 3).map(issue => <IssueCard key={issue.id} issue={issue} />)}
          {pending.length > 3 && (
            <Link to="/council/review" className="flex items-center justify-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors py-2">
              View all {pending.length} pending issues <ChevronRight size={16} />
            </Link>
          )}
        </section>
      )}

      {(stats?.pending === 0) && (
        <div className="panel p-8 text-center">
          <CheckCircle size={32} className="text-teal-400 mx-auto mb-3" />
          <p className="text-white font-semibold">All clear!</p>
          <p className="text-sm text-slate-400 mt-1">No issues awaiting council review.</p>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, color, highlight }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; highlight?: boolean;
}) {
  const iconBg: Record<string, string> = {
    indigo: 'bg-indigo-600/20 text-indigo-400',
    teal: 'bg-teal-600/20 text-teal-400',
    amber: 'bg-amber-600/20 text-amber-400',
    red: 'bg-red-600/20 text-red-400',
    slate: 'bg-slate-600/20 text-slate-400'
  };
  return (
    <div className={`panel p-4 ${highlight ? 'border-red-500/30 bg-red-500/5' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 font-display ${highlight ? 'text-red-300' : 'text-white'}`}>{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg[color] ?? iconBg.slate}`}>{icon}</div>
      </div>
    </div>
  );
}
