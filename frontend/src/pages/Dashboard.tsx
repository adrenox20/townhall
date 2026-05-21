import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCircle, FileText, ThumbsUp, Lightbulb } from 'lucide-react';
import { endpoints } from '../lib/api';
import { IssueCard } from '../components/IssueCard';
import type { Solution } from '../lib/types';
import { Link } from 'react-router-dom';
import { Badge, solutionStatusClass, solutionStatusLabels, statusClass, statusLabels } from '../lib/badges';

type DashTab = 'issues' | 'following' | 'solutions';

import { useState } from 'react';

export function Dashboard() {
  const [tab, setTab] = useState<DashTab>('issues');
  const { data: myIssues, isLoading: issuesLoading } = useQuery({ queryKey: ['myIssues'], queryFn: endpoints.myIssues });
  const { data: following } = useQuery({ queryKey: ['following'], queryFn: endpoints.following });
  const { data: notifications, isLoading: notifsLoading } = useQuery({ queryKey: ['notifications'], queryFn: endpoints.notifications });
  const { data: mySolutions } = useQuery({ queryKey: ['mySolutions'], queryFn: endpoints.mySolutions });

  const resolved = myIssues?.filter(i => i.status === 'resolved').length ?? 0;
  const totalUpvotes = myIssues?.reduce((sum, i) => sum + i.upvotes, 0) ?? 0;
  const unread = notifications?.items.filter(n => !n.is_read).length ?? 0;

  if (issuesLoading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">My Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Your issues, solutions, and activity at a glance.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<FileText size={20} />} label="Submitted" value={myIssues?.length ?? 0} color="indigo" />
        <StatCard icon={<CheckCircle size={20} />} label="Resolved" value={resolved} color="emerald" />
        <StatCard icon={<ThumbsUp size={20} />} label="Upvotes" value={totalUpvotes} color="purple" />
        <StatCard icon={<Lightbulb size={20} />} label="Solutions" value={mySolutions?.length ?? 0} color="amber" />
        <StatCard icon={<Bell size={20} />} label="Unread" value={unread} color="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            {(['issues', 'following', 'solutions'] as DashTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {t === 'issues' ? 'My Issues' : t === 'following' ? 'Following' : 'My Solutions'}
              </button>
            ))}
          </div>

          {tab === 'issues' && (
            myIssues?.length ? myIssues.map(issue => <IssueCard key={issue.id} issue={issue} />) :
            <div className="panel p-8 text-center"><p className="text-sm text-slate-400">You haven't submitted any issues yet.</p></div>
          )}

          {tab === 'following' && (
            following?.length ? following.map(issue => <IssueCard key={issue.id} issue={issue} />) :
            <div className="panel p-8 text-center"><p className="text-sm text-slate-400">Not following any issues.</p></div>
          )}

          {tab === 'solutions' && (
            mySolutions?.length ? mySolutions.map(sol => (
              <div key={sol.id} className="panel p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={solutionStatusClass[sol.status]}>{solutionStatusLabels[sol.status]}</Badge>
                  <span className="text-xs text-slate-500">on:</span>
                  <Link to={`/issues/${sol.issue_id}`} className="text-xs text-indigo-400 hover:text-indigo-300">{(sol as any).issue_title}</Link>
                </div>
                <p className="text-sm font-medium text-white">{sol.title}</p>
                <p className="text-xs text-slate-400">{sol.upvotes} upvotes</p>
              </div>
            )) :
            <div className="panel p-8 text-center"><p className="text-sm text-slate-400">You haven't proposed any solutions yet.</p></div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="panel p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Notifications</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notifications?.items.length ? notifications.items.map(item => (
                <div key={item.id} className={`rounded-lg p-3 text-sm border transition-colors ${item.is_read ? 'bg-white/[0.02] border-white/[0.04] text-slate-400' : 'bg-indigo-600/5 border-indigo-500/20 text-slate-200'}`}>
                  {item.message}
                  <p className="text-xs text-slate-600 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No notifications yet.</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const iconBg: Record<string, string> = {
    indigo: 'bg-indigo-600/20 text-indigo-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    purple: 'bg-purple-600/20 text-purple-400',
    amber: 'bg-amber-600/20 text-amber-400',
    red: 'bg-red-600/20 text-red-400'
  };
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-1 font-display">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg[color] ?? iconBg.indigo}`}>{icon}</div>
      </div>
    </div>
  );
}
