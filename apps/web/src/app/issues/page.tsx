import { Search } from 'lucide-react';
import { IssueCard } from '@/components/issues/issue-card';
import { Input } from '@/components/ui/input';
import { demoIssues } from '@/lib/api';

export default function IssuesPage() {
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><h2 className="text-2xl font-semibold">Issue feed</h2><p className="text-sm text-foreground/60">Search, filter, vote, follow, and track public grievances.</p></div><div className="relative md:w-96"><Search className="absolute left-3 top-3 size-4 text-foreground/50" /><Input className="pl-9" placeholder="Search issues" /></div></div><div className="grid gap-4">{demoIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)}</div></div>;
}
