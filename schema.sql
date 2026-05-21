PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','student_council','dept_admin','super_admin')),
  department TEXT,
  council_department TEXT,
  is_verified INTEGER DEFAULT 0,
  is_banned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id TEXT REFERENCES categories(id),
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK(status IN ('submitted','under_council_review','validated','rejected',
                     'under_review','accepted','in_progress','resolved','closed','wont_fix')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical','high','medium','low')),
  category_id TEXT REFERENCES categories(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  assigned_to TEXT REFERENCES users(id),
  department TEXT,
  is_anonymous INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  is_duplicate_of TEXT REFERENCES issues(id),
  attachment_keys TEXT,
  trending_score REAL DEFAULT 0,
  council_note TEXT,
  council_reviewer_id TEXT REFERENCES users(id),
  council_reviewed_at TEXT,
  appeal_allowed INTEGER DEFAULT 1,
  solution_count INTEGER DEFAULT 0,
  priority_suggestion TEXT,
  affected_audience TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  due_date TEXT
);

CREATE TABLE IF NOT EXISTS issue_tags (
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, tag_id)
);

CREATE TABLE IF NOT EXISTS votes (
  user_id TEXT NOT NULL REFERENCES users(id),
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  value INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, issue_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  parent_id TEXT REFERENCES comments(id),
  body TEXT NOT NULL,
  is_official_update INTEGER DEFAULT 0,
  is_internal_note INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  is_edited INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  attachment_keys TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS issue_history (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  changed_by TEXT NOT NULL REFERENCES users(id),
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS follows (
  user_id TEXT NOT NULL REFERENCES users(id),
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, issue_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  issue_id TEXT REFERENCES issues(id),
  comment_id TEXT REFERENCES comments(id),
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_active INTEGER DEFAULT 1,
  created_by TEXT REFERENCES users(id),
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS solutions (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  effort TEXT CHECK(effort IN ('quick_fix','medium','large_project')),
  cost_estimate TEXT,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK(status IN ('proposed','council_recommended','being_implemented','implemented','rejected')),
  council_note TEXT,
  council_reviewer_id TEXT REFERENCES users(id),
  admin_note TEXT,
  admin_reviewer_id TEXT REFERENCES users(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS solution_votes (
  solution_id TEXT NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  value INTEGER NOT NULL CHECK(value IN (1,-1)),
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (solution_id, user_id)
);

CREATE TABLE IF NOT EXISTS issue_appeals (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','denied')),
  council_response TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS issues_fts USING fts5(title, description, content=issues, content_rowid=rowid);

CREATE TRIGGER IF NOT EXISTS issues_ai AFTER INSERT ON issues BEGIN
  INSERT INTO issues_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS issues_ad AFTER DELETE ON issues BEGIN
  INSERT INTO issues_fts(issues_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
END;

CREATE TRIGGER IF NOT EXISTS issues_au AFTER UPDATE ON issues BEGIN
  INSERT INTO issues_fts(issues_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
  INSERT INTO issues_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS solutions_count_ai AFTER INSERT ON solutions BEGIN
  UPDATE issues SET solution_count = (SELECT COUNT(*) FROM solutions WHERE issue_id = new.issue_id AND is_deleted = 0) WHERE id = new.issue_id;
END;

CREATE TRIGGER IF NOT EXISTS solutions_count_au AFTER UPDATE ON solutions BEGIN
  UPDATE issues SET solution_count = (SELECT COUNT(*) FROM solutions WHERE issue_id = new.issue_id AND is_deleted = 0) WHERE id = new.issue_id;
END;

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category_id);
CREATE INDEX IF NOT EXISTS idx_issues_author ON issues(author_id);
CREATE INDEX IF NOT EXISTS idx_issues_upvotes ON issues(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_trending ON issues(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_follows_user ON follows(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_issue ON votes(issue_id);
CREATE INDEX IF NOT EXISTS idx_solutions_issue ON solutions(issue_id);
CREATE INDEX IF NOT EXISTS idx_solutions_upvotes ON solutions(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_appeals_issue ON issue_appeals(issue_id);
