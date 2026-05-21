export type Role = 'student' | 'moderator' | 'dept_admin' | 'super_admin';

export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  role: Role;
  department?: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  color?: string | null;
  icon?: string | null;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  usage_count?: number;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category_id?: string | null;
  category_name?: string | null;
  category_color?: string | null;
  author_id: string;
  author_name?: string | null;
  author_avatar?: string | null;
  assigned_to?: string | null;
  department?: string | null;
  is_anonymous: number;
  upvotes: number;
  view_count: number;
  is_pinned: number;
  is_locked: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  comment_count?: number;
};

export type Comment = {
  id: string;
  issue_id: string;
  author_id: string;
  parent_id?: string | null;
  body: string;
  is_official_update: number;
  is_internal_note: number;
  is_pinned: number;
  author_name?: string | null;
  created_at: string;
};

export type HistoryEntry = {
  id: string;
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  note?: string | null;
  changed_by_name?: string | null;
  created_at: string;
};
