import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { requireAuth, requirePermission } from '../middleware/auth';
import { audit } from '../middleware/audit';
import { issueMetrics } from '../services/analytics.service';
import { ok } from '../utils/response';

export const portalRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
portalRoutes.use('*', requireAuth());
portalRoutes.get('/dashboard', requirePermission('analytics:platform_read'), async (c) => ok(c, await issueMetrics(c)));
portalRoutes.get('/users', requirePermission('admin:manage'), async (c) => {
  const users = (await c.env.DB.prepare('SELECT id, email, name, status, created_at, last_login_at FROM users ORDER BY created_at DESC').all()).results;
  const roles = (await c.env.DB.prepare('SELECT user_id, role_id FROM user_roles').all()).results as { user_id: string; role_id: string }[];
  const rolesByUser: Record<string, string[]> = {};
  for (const r of roles) {
    if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
    rolesByUser[r.user_id].push(r.role_id);
  }
  return ok(c, (users as { id: string }[]).map(u => ({ ...u, roles: rolesByUser[u.id] ?? [] })));
});
portalRoutes.patch('/users/:id/role', requirePermission('rbac:manage'), zValidator('json', z.object({ roleId: z.string(), departmentId: z.string().nullable().optional(), action: z.enum(['grant', 'revoke']).default('grant') })), async (c) => {
  const body = c.req.valid('json');
  if (body.action === 'grant') await c.env.DB.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id, department_id) VALUES (?, ?, ?)').bind(c.req.param('id'), body.roleId, body.departmentId || null).run();
  else await c.env.DB.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?').bind(c.req.param('id'), body.roleId).run();
  await audit(c, 'user.role_change', 'user', c.req.param('id'), body);
  return ok(c, { updated: true });
});
portalRoutes.patch('/users/:id/suspend', requirePermission('user:suspend'), zValidator('json', z.object({ suspended: z.boolean() })), async (c) => {
  await c.env.DB.prepare('UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(c.req.valid('json').suspended ? 'suspended' : 'active', c.req.param('id')).run();
  await audit(c, 'user.suspend', 'user', c.req.param('id'), c.req.valid('json'));
  return ok(c, { updated: true });
});
portalRoutes.get('/moderation', requirePermission('comment:moderate'), async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM moderation_queue ORDER BY created_at DESC').all()).results));
portalRoutes.patch('/moderation/:id', requirePermission('comment:moderate'), zValidator('json', z.object({ status: z.string() })), async (c) => {
  await c.env.DB.prepare('UPDATE moderation_queue SET status = ?, resolved_at = datetime("now") WHERE id = ?').bind(c.req.valid('json').status, c.req.param('id')).run();
  return ok(c, { updated: true });
});
portalRoutes.get('/audit-logs', requirePermission('audit:read'), async (c) => {
  const rows = (await c.env.DB.prepare(
    `SELECT al.*, u.name AS actor_name, u.email AS actor_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_id
     WHERE al.action != 'login'
     ORDER BY al.created_at DESC LIMIT 200`
  ).all()).results;
  return ok(c, rows.map((r: Record<string, unknown>) => ({
    ...r,
    details: (() => { try { return JSON.parse(r.details as string); } catch { return {}; } })(),
  })));
});
portalRoutes.get('/settings', requirePermission('settings:manage'), async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM platform_settings').all()).results));
portalRoutes.patch('/settings', requirePermission('settings:manage'), zValidator('json', z.record(z.string())), async (c) => {
  for (const [key, value] of Object.entries(c.req.valid('json'))) await c.env.DB.prepare('INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))').bind(key, value).run();
  await audit(c, 'settings.update', 'platform_settings');
  return ok(c, { updated: true });
});
portalRoutes.get('/rbac', requirePermission('rbac:manage'), async (c) => ok(c, {
  roles: (await c.env.DB.prepare('SELECT * FROM roles').all()).results,
  permissions: (await c.env.DB.prepare('SELECT * FROM permissions').all()).results
}));
portalRoutes.patch('/rbac', requirePermission('rbac:manage'), async (c) => ok(c, { updated: true }));
