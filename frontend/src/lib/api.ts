import type { Category, Comment, HistoryEntry, Issue, Tag, User } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const tokenKey = 'uit_token';

export function getToken() {
  return localStorage.getItem(tokenKey);
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function clearToken() {
  localStorage.removeItem(tokenKey);
}

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
  me: () => api<User>('/api/auth/me'),
  requestMagicLink: (email: string) => api<{ sent: boolean; devLink?: string }>('/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) }),
  verify: (token: string) => api<{ token: string; user: User }>(`/api/auth/verify?token=${encodeURIComponent(token)}`),
  logout: () => api('/api/auth/logout', { method: 'POST' }),
  announcements: () => api<Array<{ id: string; title: string; body: string; type: string }>>('/api/announcements'),
  categories: () => api<Category[]>('/api/categories'),
  tags: () => api<Tag[]>('/api/tags'),
  issues: (params = '') => api<{ items: Issue[]; page: number; limit: number }>(`/api/issues${params}`),
  issue: (id: string) => api<{ issue: Issue; comments: Comment[]; history: HistoryEntry[]; tags: Tag[] }>(`/api/issues/${id}`),
  createIssue: (body: unknown) => api<{ id: string }>('/api/issues', { method: 'POST', body: JSON.stringify(body) }),
  vote: (id: string, value: 1 | -1 | 0) => api<{ upvotes: number }>(`/api/issues/${id}/vote`, { method: 'POST', body: JSON.stringify({ value }) }),
  follow: (id: string) => api<{ following: boolean }>(`/api/issues/${id}/follow`, { method: 'POST' }),
  addComment: (id: string, body: unknown) => api<{ id: string }>(`/api/issues/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id: string, body: { status: string; note: string }) => api<{ status: string }>(`/api/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  notifications: () => api<{ items: Array<{ id: string; message: string; is_read: number; created_at: string }> }>('/api/users/me/notifications'),
  myIssues: () => api<Issue[]>('/api/users/me/issues'),
  following: () => api<Issue[]>('/api/users/me/following'),
  adminStats: () => api<{
    totals: { open_count: number; resolved_this_month: number; avg_days_to_resolve: number; awaiting_review: number };
    byCategory: Array<{ name: string; count: number }>;
    volume: Array<{ day: string; count: number }>;
    attention: Issue[];
    trendingTags: Array<{ name: string; count: number }>;
  }>('/api/admin/stats'),
  adminIssues: () => api<Issue[]>('/api/admin/issues'),
  adminUsers: () => api<Array<User & { issue_count: number; is_banned: number; created_at: string }>>('/api/admin/users'),
  // Admin user management
  updateUserRole: (userId: string, role: string) => api<{ updated: boolean }>(`/api/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  banUser: (userId: string, banned: boolean) => api<{ updated: boolean }>(`/api/users/${userId}/ban`, { method: 'PATCH', body: JSON.stringify({ banned }) }),
  // Categories CRUD
  createCategory: (body: { name: string; description?: string; parent_id?: string | null; icon?: string; color?: string; display_order?: number }) =>
    api<{ id: string }>('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (catId: string, body: Partial<{ name: string; description: string; parent_id: string | null; icon: string; color: string; display_order: number }>) =>
    api<{ updated: boolean }>(`/api/categories/${catId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (catId: string) => api<{ deactivated: boolean }>(`/api/categories/${catId}`, { method: 'DELETE' }),
  // Tags CRUD
  createTag: (body: { name: string; color?: string }) => api<{ id: string }>('/api/tags', { method: 'POST', body: JSON.stringify(body) }),
  deleteTag: (tagId: string) => api<{ deleted: boolean }>(`/api/tags/${tagId}`, { method: 'DELETE' }),
  // Comment moderation
  deleteComment: (commentId: string) => api<{ deleted: boolean }>(`/api/comments/${commentId}`, { method: 'DELETE' }),
  editComment: (commentId: string, body: string) => api<{ updated: boolean }>(`/api/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ body }) }),
  pinComment: (commentId: string) => api<{ toggled: boolean }>(`/api/comments/${commentId}/pin`, { method: 'POST' }),
  // Issue comments (standalone fetch)
  issueComments: (issueId: string) => api<Array<{ id: string; body: string; author_name: string | null; author_id: string; is_official_update: number; is_internal_note: number; is_pinned: number; created_at: string }>>(`/api/issues/${issueId}/comments`),
};
