import { MetricGrid } from '@/components/dashboards/metric-grid';
import { IssueCard } from '@/components/issues/issue-card';
import { demoIssues } from '@/lib/api';

export default function AdminPage() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-semibold">Operational dashboard</h2><p className="text-sm text-foreground/60">Queue health, SLA risk, assignments, and institution analytics.</p></div><MetricGrid /><div className="grid gap-4 xl:grid-cols-3">{demoIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)}</div></div>;
}
