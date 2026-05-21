import type { Category, Comment, HistoryEntry, Issue, Solution, Tag, User } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const tokenKey = 'uit_token';

export function getToken() { return localStorage.getItem(tokenKey); }
export function setToken(token: string) { localStorage.setItem(tokenKey, token); }
export function clearToken() { localStorage.removeItem(tokenKey); }

type ApiEnvelope<T> = { data: T } | { error: { message: string; details?: unknown } };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? ((await response.json()) as ApiEnvelope<T>) : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : 'error' in payload ? payload.error.message : 'Request failed';
    throw new Error(message);
  }

  return typeof payload === 'string' ? (payload as T) : (payload as { data: T }).data;
}

export const endpoints = {
  // Auth
  me: () => api<User>('/api/auth/me'),
  requestMagicLink: (email: string) => api<{ sent: boolean; devLink?: string }>('/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) }),
  verify: (token: string) => api<{ token: string; user: User }>(`/api/auth/verify?token=${encodeURIComponent(token)}`),
  logout: () => api('/api/auth/logout', { method: 'POST' }),

  // Public
  announcements: () => api<Array<{ id: string; title: string; body: string; type: string }>>('/api/announcements'),
  categories: () => api<Category[]>('/api/categories'),
  tags: () => api<Tag[]>('/api/tags'),

  // Issues
  issues: (params = '') => api<{ items: Issue[]; page: number; limit: number }>(`/api/issues${params}`),
  issue: (id: string) => api<{ issue: Issue; comments: Comment[]; history: HistoryEntry[]; tags: Tag[]; solutions: Solution[] }>(`/api/issues/${id}`),
  createIssue: (body: unknown) => api<{ id: string }>('/api/issues', { method: 'POST', body: JSON.stringify(body) }),
  vote: (id: string, value: 1 | -1 | 0) => api<{ upvotes: number }>(`/api/issues/${id}/vote`, { method: 'POST', body: JSON.stringify({ value }) }),
  follow: (id: string) => api<{ following: boolean }>(`/api/issues/${id}/follow`, { method: 'POST' }),
  updateStatus: (id: string, body: { status: string; note: string }) => api<{ status: string }>(`/api/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Council actions on issues
  takeReview: (id: string, note?: string) => api<{ status: string }>(`/api/issues/${id}/take-review`, { method: 'POST', body: JSON.stringify({ note }) }),
  validateIssue: (id: string, body: { priority: string; department: string; council_note: string }) =>
    api<{ status: string }>(`/api/issues/${id}/validate`, { method: 'POST', body: JSON.stringify(body) }),
  rejectIssue: (id: string, reason: string) =>
    api<{ status: string }>(`/api/issues/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  addCouncilNote: (id: string, note: string) =>
    api<{ updated: boolean }>(`/api/issues/${id}/council-note`, { method: 'POST', body: JSON.stringify({ note }) }),
  mergeIssue: (id: string, body: { merge_into: string; note: string }) =>
    api<{ merged_into: string }>(`/api/issues/${id}/merge`, { method: 'POST', body: JSON.stringify(body) }),
  appealIssue: (id: string, reason: string) =>
    api<{ id: string }>(`/api/issues/${id}/appeal`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Solutions
  solutions: (issueId: string, sort?: string) =>
    api<Solution[]>(`/api/issues/${issueId}/solutions${sort ? `?sort=${sort}` : ''}`),
  createSolution: (issueId: string, body: unknown) =>
    api<{ id: string }>(`/api/issues/${issueId}/solutions`, { method: 'POST', body: JSON.stringify(body) }),
  voteSolution: (solId: string, value: 1 | -1 | 0) =>
    api<{ upvotes: number; downvotes: number }>(`/api/solutions/${solId}/vote`, { method: 'POST', body: JSON.stringify({ value }) }),
  recommendSolution: (solId: string, council_note?: string) =>
    api<{ status: string }>(`/api/solutions/${solId}/recommend`, { method: 'POST', body: JSON.stringify({ council_note }) }),
  implementSolution: (solId: string, body: { status: string; admin_note?: string }) =>
    api<{ status: string }>(`/api/solutions/${solId}/implement`, { method: 'POST', body: JSON.stringify(body) }),

  // User dashboard
  notifications: () => api<{ items: Array<{ id: string; message: string; is_read: number; created_at: string }> }>('/api/users/me/notifications'),
  myIssues: () => api<Issue[]>('/api/users/me/issues'),
  following: () => api<Issue[]>('/api/users/me/following'),
  mySolutions: () => api<Array<Solution & { issue_title: string }>>('/api/users/me/solutions'),

  // Admin
  adminStats: () => api<{
    totals: { open_count: number; resolved_this_month: number; avg_days_to_resolve: number; awaiting_review: number; validated_pending_admin: number };
    byCategory: Array<{ name: string; count: number }>;
    volume: Array<{ day: string; count: number }>;
    attention: Issue[];
    trendingTags: Array<{ name: string; count: number }>;
    councilKpis: { pending_council: number; rejected_count: number; active_reviewers: number };
  }>('/api/admin/stats'),
  adminIssues: () => api<Issue[]>('/api/admin/issues'),
  adminUsers: () => api<Array<User & { issue_count: number; is_banned: number; created_at: string }>>('/api/admin/users'),
  adminSolutions: () => api<Array<Solution & { issue_title: string; author_name: string }>>('/api/admin/solutions'),
  updateUserRole: (userId: string, role: string) => api<{ updated: boolean }>(`/api/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  banUser: (userId: string, banned: boolean) => api<{ updated: boolean }>(`/api/users/${userId}/ban`, { method: 'PATCH', body: JSON.stringify({ banned }) }),
  exportCsv: () => fetch(`${API_URL}/api/admin/export`, { headers: { Authorization: `Bearer ${getToken()}` } }),

  // Categories + Tags
  createCategory: (body: unknown) => api<{ id: string }>('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (catId: string, body: unknown) => api<{ updated: boolean }>(`/api/categories/${catId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (catId: string) => api<{ deactivated: boolean }>(`/api/categories/${catId}`, { method: 'DELETE' }),
  createTag: (body: { name: string; color?: string }) => api<{ id: string }>('/api/tags', { method: 'POST', body: JSON.stringify(body) }),
  deleteTag: (tagId: string) => api<{ deleted: boolean }>(`/api/tags/${tagId}`, { method: 'DELETE' }),

  // Comment moderation
  addComment: (id: string, body: unknown) => api<{ id: string }>(`/api/issues/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  deleteComment: (commentId: string) => api<{ deleted: boolean }>(`/api/comments/${commentId}`, { method: 'DELETE' }),
  editComment: (commentId: string, body: string) => api<{ updated: boolean }>(`/api/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ body }) }),
  pinComment: (commentId: string) => api<{ toggled: boolean }>(`/api/comments/${commentId}/pin`, { method: 'POST' }),
  issueComments: (issueId: string) => api<Array<{ id: string; body: string; author_name: string | null; author_id: string; is_official_update: number; is_internal_note: number; is_pinned: number; created_at: string }>>(`/api/issues/${issueId}/comments`),

  // Council portal
  councilQueue: () => api<Issue[]>('/api/council/queue'),
  councilStats: () => api<{
    pending: number; overdue: number; validatedThisWeek: number;
    avgReviewHours: number; rejectionRate: number;
    submissionTrend: Array<{ day: string; count: number }>;
  }>('/api/council/stats'),
  councilAnalytics: () => api<{
    byStatus: Array<{ status: string; count: number }>;
    byCategory: Array<{ name: string; color: string | null; count: number }>;
    volume: Array<{ day: string; count: number }>;
    topContributors: Array<{ name: string; email: string; issue_count: number }>;
    avgByDept: Array<{ department: string; total: number; avg_days: number | null }>;
  }>('/api/council/analytics')
};
