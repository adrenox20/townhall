import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingUp, Clock, Star, Lightbulb } from 'lucide-react';
import { endpoints } from '../lib/api';
import { IssueCard } from '../components/IssueCard';

const tabs = [
  { value: 'new', label: 'Recent', icon: <Clock size={14} /> },
  { value: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
  { value: 'top', label: 'Top Voted', icon: <Star size={14} /> }
];

const PUBLIC_STATUSES = ['validated', 'under_review', 'accepted', 'in_progress', 'resolved', 'closed'];

export function Home() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('new');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const params = useMemo(() => {
    const value = new URLSearchParams();
    value.set('sort', sort);
    if (search.trim()) value.set('search', search.trim());
    if (category) value.set('category', category);
    if (status) value.set('status', status);
    return `?${value.toString()}`;
  }, [category, search, sort, status]);

  const { data: announcements } = useQuery({ queryKey: ['announcements'], queryFn: endpoints.announcements });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: endpoints.categories });
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: endpoints.tags });
  const { data, isLoading } = useQuery({ queryKey: ['issues', params], queryFn: () => endpoints.issues(params) });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-5">
        {announcements?.map(item => (
          <div key={item.id} className={`rounded-xl border p-4 text-sm ${
            item.type === 'warning' ? 'border-amber-500/30 bg-amber-500/10' :
            item.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10' :
            'border-indigo-500/30 bg-indigo-500/10'
          }`}>
            <strong className={item.type === 'warning' ? 'text-amber-200' : item.type === 'success' ? 'text-emerald-200' : 'text-indigo-200'}>{item.title}</strong>
            <p className="mt-1 text-slate-300">{item.body}</p>
          </div>
        ))}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Issue Feed</h1>
            <p className="text-sm text-slate-400 mt-1">Validated campus issues — submit, track, and support fixes.</p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            {tabs.map(tab => (
              <button key={tab.value} onClick={() => setSort(tab.value)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${sort === tab.value ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-4 grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <label className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="field pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." />
          </label>
          <select className="field" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="field" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {PUBLIC_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {isLoading ? <SkeletonList /> : data?.items.length ? data.items.map(issue => <IssueCard key={issue.id} issue={issue} />) : <EmptyState />}
        </div>
      </section>

      <aside className="space-y-5 hidden lg:block">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white">Categories</h2>
          <div className="mt-3 space-y-1">
            {categories?.slice(0, 8).map(item => (
              <button key={item.id} onClick={() => setCategory(category === item.id ? '' : item.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${category === item.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}>
                <span>{item.name}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color ?? '#6366f1' }} />
              </button>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-white">Popular Tags</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags?.slice(0, 12).map(tag => (
              <span key={tag.id} className="rounded-full bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-300">#{tag.name}</span>
            ))}
          </div>
        </div>
        <div className="panel p-5 border-teal-500/20 bg-teal-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-teal-400" />
            <h2 className="text-sm font-semibold text-teal-300">Got a Solution?</h2>
          </div>
          <p className="text-xs text-slate-400">Open any issue and propose your solution. The Student Council recommends the best ones.</p>
        </div>
      </aside>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="panel p-5">
          <div className="skeleton h-4 w-32 mb-3" />
          <div className="skeleton h-5 w-3/4 mb-3" />
          <div className="skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <Search size={24} className="text-indigo-400" />
      </div>
      <h2 className="text-lg font-semibold text-white">No issues found</h2>
      <p className="mt-2 text-sm text-slate-400 max-w-sm">Try a broader search or submit the first report for this area.</p>
    </div>
  );
}
