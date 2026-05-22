export type Role = 'student' | 'institution_admin' | 'portal_admin';
export type Permission =
  | 'issue:create' | 'issue:read_public' | 'issue:update_own' | 'issue:update_any'
  | 'issue:delete_own_pre_review' | 'issue:status_update' | 'issue:assign'
  | 'issue:merge' | 'issue:archive' | 'comment:create' | 'comment:moderate'
  | 'solution:create' | 'solution:review' | 'solution:official_select'
  | 'analytics:institution_read' | 'analytics:platform_read' | 'settings:manage'
  | 'rbac:manage' | 'audit:read' | 'user:suspend' | 'admin:manage';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  status: string;
  roles: Role[];
  permissions: Permission[];
};

export function hasPermission(user: SessionUser | null | undefined, permission: Permission) {
  return Boolean(user?.permissions.includes(permission));
}

export function hasAnyPermission(user: SessionUser | null | undefined, permissions: Permission[]) {
  return Boolean(user && permissions.some((permission) => user.permissions.includes(permission)));
}
