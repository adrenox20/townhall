export type IssueStatus = 'open' | 'progress' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'med' | 'high' | 'urgent';

export interface Category {
  id: string;
  label: string;
  color: string;
}

export interface Person {
  id: string;
  name: string;
  role: 'student' | 'admin';
  title?: string;
  avatar: string;
  color: string;
}

export interface Issue {
  id: string;
  title: string;
  category: string;
  status: IssueStatus;
  priority: IssuePriority;
  location: string;
  reporter: string;
  assignee: string | null;
  upvotes: number;
  comments: number;
  createdAt: string;
  daysOpen: number;
  description?: string;
  votedByMe?: boolean;
}

export interface Comment {
  id: string;
  issueId: string;
  author: string;
  time: string;
  text: string;
}

export interface TimelineItem {
  issueId: string;
  icon: string;
  text: string;
  time: string;
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  type: 'status' | 'comment' | 'resolved' | 'upvote' | 'system';
}

export interface StatusDef {
  label: string;
  cls: string;
}

export interface PriorityDef {
  label: string;
  color: string;
}

export interface Toast {
  id: number;
  text: string;
  icon: string;
}
