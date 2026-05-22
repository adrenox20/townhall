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
