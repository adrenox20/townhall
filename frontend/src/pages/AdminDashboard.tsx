import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { endpoints } from '../lib/api';
import { IssueCard } from '../components/IssueCard';
import { AlertTriangle, CheckCircle, Clock, FileText, Users, Lightbulb } from 'lucide-react';

export function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['adminStats'], queryFn: endpoints.adminStats });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-72 rounded-xl" /><div className="skeleton h-72 rounded-xl" />
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Admin Overview</h1>
        <p className="text-sm text-slate-400 mt-1">System-wide metrics and attention items.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<FileText size={20} />} label="Open Issues" value={data.totals.open_count ?? 0} color="indigo" />
        <Kpi icon={<CheckCircle size={20} />} label="Resolved (Month)" value={data.totals.resolved_this_month ?? 0} color="emerald" />
        <Kpi icon={<Clock size={20} />} label="Avg Days to Resolve" value={Number(data.totals.avg_days_to_resolve ?? 0).toFixed(1)} color="amber" />
        <Kpi icon={<AlertTriangle size={20} />} label="Validated, Awaiting" value={data.totals.validated_pending_admin ?? 0} color="red" />
      </div>

      {/* Council KPIs */}
      {data.councilKpis && (
        <div className="grid gap-4 grid-cols-3">
          <div className="panel p-4 border-teal-500/20 bg-teal-500/5">
            <p className="text-xs font-medium text-teal-400 uppercase tracking-wide">Pending Council Review</p>
            <p className="text-2xl font-bold text-white mt-1 font-display">{data.councilKpis.pending_council}</p>
          </div>
          <div className="panel p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Rejected</p>
            <p className="text-2xl font-bold text-white mt-1 font-display">{data.councilKpis.rejected_count}</p>
          </div>
          <div className="panel p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Active Reviewers</p>
            <p className="text-2xl font-bold text-white mt-1 font-display">{data.councilKpis.active_reviewers}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Issues by Category</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Submission Volume (30 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-white">Validated — Needs Admin Pickup</h2>
        {data.attention.length ? data.attention.map(issue => <IssueCard key={issue.id} issue={issue} councilView />) : (
          <div className="panel p-6 text-center text-sm text-slate-400">All clear — no urgent items.</div>
        )}
      </section>
    </div>
  );
}

function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const iconBg: Record<string, string> = {
    indigo: 'bg-indigo-600/20 text-indigo-400', emerald: 'bg-emerald-600/20 text-emerald-400',
    amber: 'bg-amber-600/20 text-amber-400', red: 'bg-red-600/20 text-red-400'
  };
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-1 font-display">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
