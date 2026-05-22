import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CommentList } from '@/components/comments/comment-list';
import { SolutionList } from '@/components/solutions/solution-list';
import { demoIssues } from '@/lib/api';

export function generateStaticParams() {
  return demoIssues.map((issue) => ({ id: issue.id }));
}

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = demoIssues.find((item) => item.id === id) || demoIssues[0];
  return <div className="grid gap-5 xl:grid-cols-[1fr_380px]"><div className="space-y-5"><Card><CardHeader><div className="flex flex-wrap gap-2"><Badge>{issue.public_id}</Badge><Badge>{issue.status}</Badge><Badge>{issue.urgency}</Badge></div><h2 className="mt-3 text-2xl font-semibold">{issue.title}</h2></CardHeader><CardContent><p className="text-foreground/75">Detailed issue description, attachments, watcher state, vote controls, and anonymous author rules are represented here and backed by the Worker API.</p></CardContent></Card><CommentList /></div><div className="space-y-5"><SolutionList /><Card><CardHeader><h2 className="font-semibold">Timeline</h2></CardHeader><CardContent className="space-y-3 text-sm"><p>Submitted for review</p><p>Assigned to {issue.department}</p><p>Status changed to {issue.status}</p></CardContent></Card></div></div>;
}
