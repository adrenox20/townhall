import type { Issue } from '@/lib/types';
import { peopleById } from '@/lib/data';
import { Icon } from '@/components/ui/icon';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge, CategoryBadge } from '@/components/ui/badge';

interface IssueRowProps {
  issue: Issue;
  onClick: () => void;
  onVote: (id: string) => void;
  voteBoost?: number;
}

export function IssueRow({ issue, onClick, onVote, voteBoost = 0 }: IssueRowProps) {
  const reporter = peopleById[issue.reporter];
  const voted = issue.votedByMe ? voteBoost >= 0 : voteBoost > 0;
  const count = issue.upvotes + voteBoost;

  return (
    <div className="issue-row" onClick={onClick}>
      <div
        className={`upvote${voted ? ' voted' : ''}`}
        onClick={e => { e.stopPropagation(); onVote(issue.id); }}
      >
        <Icon name="arrow-up" size={12} stroke={2.4} />
        <span className="upvote-count">{count}</span>
      </div>

      <div style={{ minWidth: 0 }}>
        <div className="issue-title">{issue.title}</div>
        <div className="issue-meta">
          <span className="mono">{issue.id}</span>
          <span className="dot-sep" />
          <CategoryBadge id={issue.category} />
          <span className="dot-sep" />
          <Icon name="map-pin" size={11} />
          <span>{issue.location}</span>
          <span className="dot-sep" />
          <Icon name="msg" size={11} />
          <span>{issue.comments}</span>
          <span className="dot-sep" />
          <span>{issue.createdAt}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StatusBadge status={issue.status} />
        <Avatar person={reporter} size="sm" />
      </div>
    </div>
  );
}
