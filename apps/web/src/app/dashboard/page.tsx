import { MetricGrid } from '@/components/dashboards/metric-grid';
import { IssueCard } from '@/components/issues/issue-card';
import { demoIssues } from '@/lib/api';

export default function DashboardPage() {
  return <div className="space-y-5"><div><h2 className="text-2xl font-semibold">Student dashboard</h2><p className="text-sm text-foreground/60">Submitted issues, follows, notifications, and solution activity.</p></div><MetricGrid /><div className="grid gap-4 lg:grid-cols-2">{demoIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)}</div></div>;
}
