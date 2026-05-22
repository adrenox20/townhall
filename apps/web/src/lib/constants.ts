export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787/api/v1';
export const statuses = ['pending_review', 'open', 'under_investigation', 'in_progress', 'waiting_for_student_response', 'escalated', 'resolved', 'rejected', 'archived'];
export const statusLabels: Record<string, string> = {
  pending_review: 'Pending Review',
  open: 'Open',
  under_investigation: 'Under Investigation',
  in_progress: 'In Progress',
  waiting_for_student_response: 'Waiting for Student Response',
  escalated: 'Escalated',
  resolved: 'Resolved',
  rejected: 'Rejected',
  archived: 'Archived'
};

export const statusBadgeClass: Record<string, string> = {
  pending_review: 'badge--open',
  open: 'badge--open',
  under_investigation: 'badge--progress',
  in_progress: 'badge--progress',
  waiting_for_student_response: 'badge--progress',
  escalated: 'badge--progress',
  resolved: 'badge--resolved',
  rejected: 'badge--closed',
  archived: 'badge--closed',
};

export const urgencyColors: Record<string, string> = {
  low: 'oklch(0.6 0.008 80)',
  medium: 'oklch(0.65 0.13 245)',
  high: 'oklch(0.7 0.15 75)',
  critical: 'oklch(0.58 0.2 25)',
};
