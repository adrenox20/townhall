import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env } from '../types/env';
import { ok } from '../lib/response';
import { requireAuth, requireRole } from '../middleware/auth';

export const userRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

userRoutes.use('*', requireAuth);

userRoutes.get('/me/notifications', async (c) => {
  const page = Math.max(Number(c.req.query('page') ?? '1'), 1);
  const limit = Math.min(Number(c.req.query('limit') ?? '20'), 50);
  const rows = await c.env.DB.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(c.get('user').id, limit, (page - 1) * limit).all();
  return ok(c, { items: rows.results, page, limit });
});

userRoutes.patch('/me/notifications/read', async (c) => {
  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').bind(c.get('user').id).run();
  return ok(c, { updated: true });
});

userRoutes.get('/me/issues', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM issues WHERE author_id = ? ORDER BY created_at DESC'
  ).bind(c.get('user').id).all();
  return ok(c, rows.results);
});

userRoutes.get('/me/following', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT issues.* FROM issues JOIN follows ON follows.issue_id = issues.id WHERE follows.user_id = ? ORDER BY follows.created_at DESC'
  ).bind(c.get('user').id).all();
  return ok(c, rows.results);
});

userRoutes.get('/me/solutions', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT solutions.*, issues.title AS issue_title FROM solutions
     LEFT JOIN issues ON issues.id = solutions.issue_id
     WHERE solutions.author_id = ? AND solutions.is_deleted = 0
     ORDER BY solutions.created_at DESC`
  ).bind(c.get('user').id).all();
  return ok(c, rows.results);
});

userRoutes.get('/:id', requireRole('student_council'), async (c) => {
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, avatar_url, role, department, created_at, last_login FROM users WHERE id = ?'
  ).bind(c.req.param('id')).first();
  return ok(c, user);
});

userRoutes.patch(
  '/:id/role',
  requireRole('super_admin'),
  zValidator('json', z.object({
    role: z.enum(['student', 'student_council', 'dept_admin', 'super_admin'])
  })),
  async (c) => {
    await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(c.req.valid('json').role, c.req.param('id')).run();
    return ok(c, { updated: true });
  }
);

userRoutes.patch(
  '/:id/ban',
  requireRole('super_admin'),
  zValidator('json', z.object({ banned: z.boolean() })),
  async (c) => {
    await c.env.DB.prepare('UPDATE users SET is_banned = ? WHERE id = ?').bind(c.req.valid('json').banned ? 1 : 0, c.req.param('id')).run();
    return ok(c, { updated: true });
  }
);
