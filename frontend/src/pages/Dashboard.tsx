import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCircle, FileText, ThumbsUp } from 'lucide-react';
import { endpoints } from '../lib/api';
import { IssueCard } from '../components/IssueCard';

export function Dashboard() {
  const { data: myIssues, isLoading: issuesLoading } = useQuery({ queryKey: ['myIssues'], queryFn: endpoints.myIssues });
  const { data: following } = useQuery({ queryKey: ['following'], queryFn: endpoints.following });
  const { data: notifications, isLoading: notifsLoading } = useQuery({ queryKey: ['notifications'], queryFn: endpoints.notifications });
  const resolved = myIssues?.filter((issue) => issue.status === 'resolved').length ?? 0;

  if (issuesLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Your issues and activity at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<FileText size={20} />} label="Submitted" value={myIssues?.length ?? 0} color="indigo" />
        <StatCard icon={<CheckCircle size={20} />} label="Resolved" value={resolved} color="emerald" />
        <StatCard icon={<ThumbsUp size={20} />} label="Upvotes" value={myIssues?.reduce((sum, issue) => sum + issue.upvotes, 0) ?? 0} color="purple" />
        <StatCard icon={<Bell size={20} />} label="Unread" value={notifications?.items.filter((item) => !item.is_read).length ?? 0} color="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* My Issues */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-white">My Issues</h2>
          {myIssues?.length ? (
            myIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
          ) : (
            <div className="panel p-8 text-center">
              <p className="text-sm text-slate-400">You haven't submitted any issues yet.</p>
            </div>
          )}
        </section>

        {/* Right Column */}
        <aside className="space-y-5">
          {/* Notifications */}
          <div className="panel p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Notifications</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications?.items.length ? notifications.items.map((item) => (
                <div key={item.id} className={`rounded-lg p-3 text-sm border transition-colors ${
                  item.is_read ? 'bg-white/[0.02] border-white/[0.04] text-slate-400' : 'bg-indigo-600/5 border-indigo-500/20 text-slate-200'
                }`}>
                  {item.message}
                </div>
              )) : (
                <p className="text-sm text-slate-500">No notifications yet.</p>
              )}
            </div>
          </div>

          {/* Following */}
          <div className="panel p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Following</h2>
            <div className="space-y-2">
              {following?.slice(0, 6).map((issue) => (
                <div key={issue.id} className="text-sm text-slate-300 py-1.5 border-b border-white/[0.04] last:border-0 truncate">
                  {issue.title}
                </div>
              ))}
              {!following?.length && <p className="text-sm text-slate-500">Not following any issues.</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-600/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-600/10 text-amber-400 border-amber-500/20',
  };
  const iconBg: Record<string, string> = {
    indigo: 'bg-indigo-600/20 text-indigo-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    purple: 'bg-purple-600/20 text-purple-400',
    amber: 'bg-amber-600/20 text-amber-400',
  };

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-1 font-display">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
