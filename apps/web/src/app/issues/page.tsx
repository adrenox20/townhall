'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { ISSUES, CATEGORIES, STATUS, PRIORITY, peopleById } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge, CategoryBadge, PriorityDot } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { IssueRow } from '@/components/issues/issue-row';

export default function IssuesPage() {
  const { role, votes, handleVote } = useApp();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [view, setView] = useState('rows');
  const [q, setQ] = useState('');

  const filtered = ISSUES
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .filter(i => categoryFilter === 'all' || i.category === categoryFilter)
    .filter(i => !q || i.title.toLowerCase().includes(q.toLowerCase()) || i.id.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'trending') return (b.upvotes + (votes[b.id] || 0)) - (a.upvotes + (votes[a.id] || 0));
      if (sortBy === 'newest') return a.daysOpen - b.daysOpen;
      if (sortBy === 'oldest') return b.daysOpen - a.daysOpen;
      return 0;
    });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            All issues{' '}
            <span style={{ color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)', fontSize: 22 }}>
              {filtered.length}
            </span>
          </h1>
          <p className="page-sub">Everything reported across campus. Filter by category or status, or sort by what&apos;s getting the most support.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Segmented
            value={view}
            onChange={setView}
            options={[{ value: 'rows', label: 'Rows' }, { value: 'table', label: 'Table' }]}
          />
          {role !== 'admin' && (
            <Button variant="accent" icon="plus" onClick={() => router.push('/issues/new')}>Report</Button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <Icon name="search" size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by title or ID..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className={`chip${statusFilter === 'all' ? ' active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} className={`chip${statusFilter === k ? ' active' : ''}`} onClick={() => setStatusFilter(k)}>{v.label}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="select" style={{ width: 'auto' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="trending">Most upvoted</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {view === 'rows' ? (
          <div>
            {filtered.map(issue => (
              <IssueRow
                key={issue.id}
                issue={issue}
                onClick={() => router.push(`/issues/${issue.id}`)}
                onVote={handleVote}
                voteBoost={votes[issue.id] || 0}
              />
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
                No issues match your filters.
              </div>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Title</th>
                <th style={{ width: 160 }}>Category</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 100 }}>Priority</th>
                <th style={{ width: 80 }}>Votes</th>
                <th style={{ width: 100 }}>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(issue => (
                <tr key={issue.id} onClick={() => router.push(`/issues/${issue.id}`)}>
                  <td><span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{issue.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{issue.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{issue.location} · {issue.createdAt}</div>
                  </td>
                  <td><CategoryBadge id={issue.category} /></td>
                  <td><StatusBadge status={issue.status} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <PriorityDot p={issue.priority} />
                      {PRIORITY[issue.priority].label}
                    </div>
                  </td>
                  <td><span className="mono" style={{ fontWeight: 600 }}>{issue.upvotes + (votes[issue.id] || 0)}</span></td>
                  <td>
                    {issue.assignee
                      ? <Avatar person={peopleById[issue.assignee]} size="sm" />
                      : <span style={{ color: 'var(--fg-subtle)', fontSize: 11.5 }}>Unassigned</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
