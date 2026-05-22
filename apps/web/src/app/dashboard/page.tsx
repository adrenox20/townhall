'use client';

import { useRouter } from 'next/navigation';
import { ResponsiveContainer, AreaChart as RAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useApp } from '@/context/app-context';
import { ISSUES, CATEGORIES, peopleById } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stat } from '@/components/ui/stat';
import { StatusBadge, CategoryBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { IssueRow } from '@/components/issues/issue-row';

export default function DashboardPage() {
  const { role, votes, handleVote } = useApp();
  const router = useRouter();
  const me = role === 'admin' ? 's1' : 'u1';
  const myIssues = ISSUES.filter(i => role === 'admin' ? i.assignee === me : i.reporter === me);
  const trending = [...ISSUES]
    .sort((a, b) => (b.upvotes + (votes[b.id] || 0)) - (a.upvotes + (votes[a.id] || 0)))
    .slice(0, 5);
  const recentlyResolved = ISSUES.filter(i => i.status === 'resolved').slice(0, 3);

  const studentStats = [
    { label: 'Open across campus', value: ISSUES.filter(i => i.status === 'open').length, delta: '+4', deltaDir: 'up' as const, hint: 'vs last week' },
    { label: 'Your reports', value: myIssues.length, delta: '2 active', deltaDir: '' as const, hint: '' },
    { label: 'Resolved this week', value: 18, delta: '+22%', deltaDir: 'up' as const, hint: '' },
    { label: 'Avg. response', value: '9h', delta: '−3h', deltaDir: 'down' as const, hint: 'from 12h' },
  ];
  const adminStats = [
    { label: 'Unassigned queue', value: ISSUES.filter(i => !i.assignee && i.status !== 'resolved' && i.status !== 'closed').length, delta: 'Needs triage', deltaDir: '' as const, hint: '' },
    { label: 'Assigned to you', value: myIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length, delta: '3 high priority', deltaDir: 'up' as const, hint: '' },
    { label: 'Closed this week', value: 18, delta: 'On track', deltaDir: 'up' as const, hint: '' },
    { label: 'Avg. resolution', value: '2.4d', delta: '−0.6d', deltaDir: 'down' as const, hint: 'vs target 3d' },
  ];
  const stats = role === 'admin' ? adminStats : studentStats;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {role === 'admin' ? 'Good morning, Vikram.' : 'Hey Aarav,'}{' '}
            <span style={{ color: 'var(--fg-subtle)', fontStyle: 'italic' }}>
              {role === 'admin' ? '12 things to look at.' : 'anything broken?'}
            </span>
          </h1>
          <p className="page-sub">
            {role === 'admin'
              ? "A quick view of what's open, who's working on what, and where to focus today."
              : "What students are saying, and what's been fixed since you last logged in."}
          </p>
        </div>
        {role !== 'admin' ? (
          <Button variant="accent" icon="plus" onClick={() => router.push('/issues/new')}>Report an issue</Button>
        ) : (
          <Button variant="primary" icon="shield" onClick={() => router.push('/admin/kanban')}>Open triage queue</Button>
        )}
      </div>

      <div className="g g-4" style={{ marginBottom: 22 }}>
        {stats.map((s, i) => <Stat key={i} {...s} />)}
      </div>

      <div className="g g-3">
        <Card
          className="col-2"
          title={role === 'admin' ? 'Trending right now' : 'What\'s getting upvoted'}
          sub={role === 'admin' ? 'Issues with the most student support in the last 48 hours' : 'Show your support so staff prioritise the right things'}
          action={<Button variant="ghost" size="sm" onClick={() => router.push('/issues')} iconRight="chevron-right">View all</Button>}
        >
          <div style={{ margin: '-6px -2px' }}>
            {trending.map(issue => (
              <IssueRow
                key={issue.id}
                issue={issue}
                onClick={() => router.push(`/issues/${issue.id}`)}
                onVote={handleVote}
                voteBoost={votes[issue.id] || 0}
              />
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title={role === 'admin' ? 'Your queue' : 'Your reports'}
            sub={role === 'admin' ? 'Assigned to you' : 'Issues you\'ve opened'}
          >
            {myIssues.length === 0 ? (
              <div style={{ padding: '12px 0', color: 'var(--fg-muted)', fontSize: 13 }}>Nothing here yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myIssues.slice(0, 4).map(issue => (
                  <div
                    key={issue.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                    onClick={() => router.push(`/issues/${issue.id}`)}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {issue.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>{issue.id}</div>
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Recently resolved" sub="Wins worth celebrating">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentlyResolved.map(issue => (
                <div key={issue.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--success-soft)', color: 'var(--success)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={13} stroke={2.4} />
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 500, color: 'var(--fg)' }}>{issue.title}</div>
                    <div style={{ color: 'var(--fg-subtle)', fontSize: 11, marginTop: 2 }}>
                      Fixed by {issue.assignee ? peopleById[issue.assignee]?.name : 'Staff'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="g g-3" style={{ marginTop: 22 }}>
        <Card title="Categories" sub="Tap to filter the issues list">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.slice(0, 8).map(c => {
              const count = ISSUES.filter(i => i.category === c.id).length;
              return (
                <button key={c.id} className="chip" onClick={() => router.push('/issues')}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: c.color }} />
                  {c.label}
                  <span style={{ color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="This week at a glance" sub="Issues opened vs resolved" className="col-2">
          <MiniSparkline />
        </Card>
      </div>
    </div>
  );
}

function MiniSparkline() {
  const data = [
    { day: 'Mon', opened: 5,  resolved: 3 },
    { day: 'Tue', opened: 8,  resolved: 5 },
    { day: 'Wed', opened: 6,  resolved: 7 },
    { day: 'Thu', opened: 11, resolved: 6 },
    { day: 'Fri', opened: 9,  resolved: 10 },
    { day: 'Sat', opened: 4,  resolved: 6 },
    { day: 'Sun', opened: 3,  resolved: 4 },
  ];

  return (
    <div style={{ height: 220 }}>
      <AreaChart data={data} />
    </div>
  );
}

function AreaChart({ data }: { data: { day: string; opened: number; resolved: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RAreaChart data={data}>
        <defs>
          <linearGradient id="gradOpened" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.1} />
            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: 'var(--fg-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--fg-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--fg)' }} />
        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, color: 'var(--fg-muted)', paddingTop: 8 }} />
        <Area type="monotone" dataKey="opened" name="Opened" stroke="var(--accent)" fill="url(#gradOpened)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="var(--success)" fill="url(#gradResolved)" strokeWidth={2} dot={false} />
      </RAreaChart>
    </ResponsiveContainer>
  );
}
