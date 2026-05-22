export const workflowTransitions: Record<string, string[]> = {
  pending_review: ['open', 'rejected'],
  open: ['under_investigation'],
  under_investigation: ['in_progress', 'waiting_for_student_response'],
  waiting_for_student_response: ['under_investigation'],
  in_progress: ['escalated', 'resolved'],
  escalated: ['in_progress', 'resolved'],
  resolved: ['archived'],
  rejected: ['archived'],
  archived: []
};

export function canTransition(from: string, to: string) {
  return workflowTransitions[from]?.includes(to) || false;
}
