import Link from 'next/link';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { statusLabels } from '@/lib/constants';

export type IssueCardData = {
  id: string;
  public_id: string;
  title: string;
  status: string;
  urgency: string;
  department?: string;
  category?: string;
  votes?: number;
  comments?: number;
  sla_due_at?: string;
};

export function IssueCard({ issue }: { issue: IssueCardData }) {
  return (
    <Link href={`/issues/${issue.id}`}>
      <Card className="transition hover:border-primary">
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{issue.public_id}</Badge>
            <Badge>{statusLabels[issue.status] || issue.status}</Badge>
            <Badge className={issue.urgency === 'critical' ? 'border-danger text-danger' : ''}>{issue.urgency}</Badge>
          </div>
          <h3 className="text-base font-semibold">{issue.title}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/65">
            <span>{issue.department || 'Unassigned'}</span>
            <span>{issue.category || 'General'}</span>
            <span className="inline-flex items-center gap-1"><ThumbsUp size={15} /> {issue.votes || 0}</span>
            <span className="inline-flex items-center gap-1"><MessageSquare size={15} /> {issue.comments || 0}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
