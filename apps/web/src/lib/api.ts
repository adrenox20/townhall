import { API_URL } from './constants';

type Envelope<T> = { data: T; meta?: Record<string, unknown> };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'Request failed');
  return (body as Envelope<T>).data;
}

export const demoIssues = [
  { id: 'issue_demo_1', public_id: 'GRV-102381', title: 'Wi-Fi outage in library second floor', status: 'under_investigation', urgency: 'high', department: 'Information Technology', category: 'IT Services', votes: 42, comments: 8, sla_due_at: '2026-05-24T10:00:00.000Z' },
  { id: 'issue_demo_2', public_id: 'GRV-219430', title: 'Water leakage near Hostel B mess', status: 'in_progress', urgency: 'critical', department: 'Hostel Administration', category: 'Hostel', votes: 28, comments: 11, sla_due_at: '2026-05-23T07:00:00.000Z' },
  { id: 'issue_demo_3', public_id: 'GRV-884012', title: 'Exam timetable clash for elective courses', status: 'pending_review', urgency: 'medium', department: 'Academics', category: 'Academic', votes: 17, comments: 5, sla_due_at: '2026-05-27T16:00:00.000Z' }
];
