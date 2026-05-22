import type { Permission, RoleName, User } from '../env';

export async function getUserWithPermissions(db: D1Database, userId: string): Promise<User | null> {
  const user = await db.prepare('SELECT id, email, name, status FROM users WHERE id = ?').bind(userId).first<Omit<User, 'roles' | 'permissions'>>();
  if (!user) return null;
  const rows = await db.prepare(
    `SELECT r.name role, p.name permission
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     JOIN role_permissions rp ON rp.role_id = r.id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = ?`
  ).bind(userId).all<{ role: RoleName; permission: Permission }>();
  return {
    ...user,
    roles: [...new Set(rows.results.map((row) => row.role))],
    permissions: [...new Set(rows.results.map((row) => row.permission))]
  };
}
