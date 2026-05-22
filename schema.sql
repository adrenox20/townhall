PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT);
CREATE TABLE IF NOT EXISTS permissions (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT);
CREATE TABLE IF NOT EXISTS role_permissions (role_id TEXT NOT NULL, permission_id TEXT NOT NULL, PRIMARY KEY (role_id, permission_id));
CREATE TABLE IF NOT EXISTS user_roles (user_id TEXT NOT NULL, role_id TEXT NOT NULL, department_id TEXT, PRIMARY KEY (user_id, role_id, department_id));

CREATE TABLE IF NOT EXISTS departments (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL, is_active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL, sla_hours INTEGER DEFAULT 72, is_active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL, is_active INTEGER DEFAULT 1);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  description TEXT NOT NULL,
  summary TEXT,
  category_id TEXT,
  department_id TEXT,
  author_id TEXT NOT NULL,
  assignee_id TEXT,
  status TEXT NOT NULL,
  urgency TEXT NOT NULL,
  priority_score REAL DEFAULT 0,
  visibility TEXT DEFAULT 'public',
  is_anonymous INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  master_issue_id TEXT,
  duplicate_score REAL,
  first_response_at TEXT,
  resolved_at TEXT,
  sla_due_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS issue_tags (issue_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (issue_id, tag_id));
CREATE TABLE IF NOT EXISTS issue_watchers (issue_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (issue_id, user_id));
CREATE TABLE IF NOT EXISTS issue_votes (issue_id TEXT NOT NULL, user_id TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, PRIMARY KEY (issue_id, user_id));
CREATE TABLE IF NOT EXISTS issue_workflow_events (id TEXT PRIMARY KEY, issue_id TEXT NOT NULL, actor_id TEXT NOT NULL, from_status TEXT, to_status TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS issue_assignments (id TEXT PRIMARY KEY, issue_id TEXT NOT NULL, assignee_id TEXT NOT NULL, actor_id TEXT NOT NULL, created_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public',
  is_official INTEGER DEFAULT 0,
  is_internal INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS solutions (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed',
  is_official INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS solution_votes (solution_id TEXT NOT NULL, user_id TEXT NOT NULL, kind TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (solution_id, user_id, kind));

CREATE TABLE IF NOT EXISTS attachments (id TEXT PRIMARY KEY, issue_id TEXT, comment_id TEXT, solution_id TEXT, uploader_id TEXT NOT NULL, r2_key TEXT UNIQUE NOT NULL, filename TEXT NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, body TEXT, issue_id TEXT, is_read INTEGER DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, ip TEXT, user_agent TEXT, details TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS merge_relations (id TEXT PRIMARY KEY, master_issue_id TEXT NOT NULL, merged_issue_id TEXT NOT NULL, actor_id TEXT NOT NULL, reason TEXT, score REAL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS related_issues (id TEXT PRIMARY KEY, issue_id TEXT NOT NULL, related_issue_id TEXT NOT NULL, relation_type TEXT NOT NULL, score REAL NOT NULL, created_at TEXT NOT NULL, UNIQUE(issue_id, related_issue_id));
CREATE TABLE IF NOT EXISTS activity_events (id TEXT PRIMARY KEY, issue_id TEXT, actor_id TEXT, type TEXT NOT NULL, summary TEXT NOT NULL, metadata TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS saved_filters (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, filters TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS moderation_queue (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, reporter_id TEXT, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', assigned_to TEXT, created_at TEXT NOT NULL, resolved_at TEXT);
CREATE TABLE IF NOT EXISTS rate_limit_events (id TEXT PRIMARY KEY, key TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, ip TEXT, user_agent TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_magic_links (id TEXT PRIMARY KEY, email TEXT NOT NULL, token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, consumed_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_invites (id TEXT PRIMARY KEY, email TEXT NOT NULL, role_id TEXT NOT NULL, invited_by TEXT NOT NULL, expires_at TEXT NOT NULL, accepted_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS platform_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);

CREATE INDEX IF NOT EXISTS idx_issues_status_created ON issues(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_department_status ON issues(department_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_category_status ON issues(category_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_author_created ON issues(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_master ON issues(master_issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue_created ON comments(issue_id, created_at);
CREATE INDEX IF NOT EXISTS idx_solutions_issue_status_votes ON solutions(issue_id, status, upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_created ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_issue_created ON activity_events(issue_id, created_at DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS issues_fts USING fts5(
  title,
  description,
  summary,
  tags,
  category,
  department,
  content='issues',
  content_rowid='rowid'
);
