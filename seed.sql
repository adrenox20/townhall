INSERT OR IGNORE INTO roles (id, name, description) VALUES
  ('role_student', 'student', 'Default student role'),
  ('role_institution_admin', 'institution_admin', 'Institution operations administrator'),
  ('role_portal_admin', 'portal_admin', 'Global portal administrator');

INSERT OR IGNORE INTO permissions (id, name, description) VALUES
  ('perm_issue_create', 'issue:create', 'Create issues'),
  ('perm_issue_read_public', 'issue:read_public', 'Read public issues'),
  ('perm_issue_update_own', 'issue:update_own', 'Update own pending-review issues'),
  ('perm_issue_update_any', 'issue:update_any', 'Update any issue'),
  ('perm_issue_delete_own_pre_review', 'issue:delete_own_pre_review', 'Delete own issue before review'),
  ('perm_issue_status_update', 'issue:status_update', 'Update issue workflow status'),
  ('perm_issue_assign', 'issue:assign', 'Assign issues'),
  ('perm_issue_merge', 'issue:merge', 'Merge duplicate issues'),
  ('perm_issue_archive', 'issue:archive', 'Archive issues'),
  ('perm_comment_create', 'comment:create', 'Create comments'),
  ('perm_comment_moderate', 'comment:moderate', 'Moderate comments'),
  ('perm_solution_create', 'solution:create', 'Suggest solutions'),
  ('perm_solution_review', 'solution:review', 'Review solutions'),
  ('perm_solution_official_select', 'solution:official_select', 'Select official solution'),
  ('perm_analytics_institution_read', 'analytics:institution_read', 'Read institution analytics'),
  ('perm_analytics_platform_read', 'analytics:platform_read', 'Read platform analytics'),
  ('perm_settings_manage', 'settings:manage', 'Manage settings'),
  ('perm_rbac_manage', 'rbac:manage', 'Manage RBAC'),
  ('perm_audit_read', 'audit:read', 'Read audit logs'),
  ('perm_user_suspend', 'user:suspend', 'Suspend users'),
  ('perm_admin_manage', 'admin:manage', 'Manage admins');

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role_student', id FROM permissions WHERE name IN (
  'issue:create','issue:read_public','issue:update_own','issue:delete_own_pre_review',
  'comment:create','solution:create'
);
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role_institution_admin', id FROM permissions WHERE name IN (
  'issue:create','issue:read_public','issue:update_own','issue:update_any',
  'issue:delete_own_pre_review','issue:status_update','issue:assign','issue:merge',
  'issue:archive','comment:create','comment:moderate','solution:create',
  'solution:review','solution:official_select','analytics:institution_read'
);
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role_portal_admin', id FROM permissions;

INSERT OR IGNORE INTO departments (id, name, slug) VALUES
  ('dept_facilities', 'Facilities', 'facilities'),
  ('dept_hostel', 'Hostel Administration', 'hostel'),
  ('dept_academics', 'Academics', 'academics'),
  ('dept_it', 'Information Technology', 'it'),
  ('dept_safety', 'Campus Safety', 'safety');

INSERT OR IGNORE INTO categories (id, name, slug, sla_hours) VALUES
  ('cat_infra', 'Infrastructure', 'infrastructure', 72),
  ('cat_hostel', 'Hostel', 'hostel', 48),
  ('cat_academic', 'Academic', 'academic', 120),
  ('cat_it', 'IT Services', 'it-services', 24),
  ('cat_safety', 'Safety', 'safety', 12);

INSERT OR IGNORE INTO tags (id, name, slug) VALUES
  ('tag_wifi', 'Wi-Fi', 'wifi'),
  ('tag_water', 'Water', 'water'),
  ('tag_electricity', 'Electricity', 'electricity'),
  ('tag_cleanliness', 'Cleanliness', 'cleanliness'),
  ('tag_exam', 'Exam', 'exam');

INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES
  ('allowed_email_domain', 'rishihood.edu.in', datetime('now')),
  ('duplicate_likely_threshold', '0.78', datetime('now')),
  ('duplicate_related_threshold', '0.55', datetime('now')),
  ('issue_edit_window_minutes', '30', datetime('now'));
