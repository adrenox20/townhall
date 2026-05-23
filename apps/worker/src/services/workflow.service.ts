export const workflowTransitions: Record<string, string[]> = {
  pending_review: ['open', 'rejected'], // kept for backward compat with existing data
  open: ['under_investigation', 'rejected'],
  under_investigation: ['in_progress', 'waiting_for_student_response', 'rejected'],
  waiting_for_student_response: ['under_investigation', 'in_progress'],
  in_progress: ['escalated', 'resolved', 'waiting_for_student_response'],
  escalated: ['in_progress', 'resolved'],
  resolved: ['archived', 'open'],
  rejected: ['archived', 'open'],
  archived: ['open']
};

export function canTransition(from: string, to: string) {
  return workflowTransitions[from]?.includes(to) || false;
}
