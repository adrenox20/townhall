import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { endpoints } from '../lib/api';
import { statusLabels } from '../lib/badges';

const STATUS_COLORS: Record<string, string> = {
  submitted: '#64748b', under_council_review: '#a855f7', validated: '#14b8a6',
  rejected: '#ef4444', under_review: '#3b82f6', accepted: '#8b5cf6',
  in_progress: '#f59e0b', resolved: '#10b981', closed: '#71717a', wont_fix: '#7f1d1d'
};

export function CouncilAnalytics() {
  const { data, isLoading } = useQuery({ queryKey: ['councilAnalytics'], queryFn: endpoints.councilAnalytics });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-2">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-64 rounded-xl" />)}
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Council Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Campus-wide issue trends and statistics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submission volume */}
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Submission Volume (30 Days)</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={data.volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Issues by Status</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, percent }) => `${statusLabels[status] ?? status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {data.byStatus.map((entry, index) => (
                    <Cell key={index} fill={STATUS_COLORS[entry.status] ?? '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} formatter={(v, n) => [v, statusLabels[String(n)] ?? n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues by category */}
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Issues by Category</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg resolution by dept */}
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Avg Resolution Time by Dept (Days)</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data.avgByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="avg_days" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top contributors */}
      <div className="panel p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Top Contributors</h2>
        <div className="space-y-2">
          {data.topContributors.slice(0, 8).map((user, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-5">{i + 1}.</span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-semibold">
                  {(user.name ?? user.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-indigo-300">{user.issue_count} issues</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
