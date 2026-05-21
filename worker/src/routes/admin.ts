import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env } from '../types/env';
import { id } from '../lib/ids';
import { ok } from '../lib/response';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

adminRoutes.use('*', requireAuth, requireRole('moderator'));

adminRoutes.get('/stats', async (c) => {
  const [totals, byCategory, volume, attention, tags] = await Promise.all([
    c.env.DB.prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status NOT IN ('resolved','closed','wont_fix') THEN 1 ELSE 0 END) AS open_count,
        SUM(CASE WHEN status = 'resolved' AND resolved_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS resolved_this_month,
        AVG(CASE WHEN resolved_at IS NOT NULL THEN julianday(resolved_at) - julianday(created_at) END) AS avg_days_to_resolve,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS awaiting_review
       FROM issues`
    ).first(),
    c.env.DB.prepare('SELECT categories.name, COUNT(issues.id) AS count FROM categories LEFT JOIN issues ON issues.category_id = categories.id GROUP BY categories.id ORDER BY count DESC').all(),
    c.env.DB.prepare("SELECT date(created_at) AS day, COUNT(*) AS count FROM issues WHERE created_at >= datetime('now', '-30 days') GROUP BY day ORDER BY day").all(),
    c.env.DB.prepare("SELECT * FROM issues WHERE status = 'submitted' AND created_at <= datetime('now', '-48 hours') ORDER BY created_at ASC LIMIT 20").all(),
    c.env.DB.prepare('SELECT tags.name, COUNT(issue_tags.issue_id) AS count FROM tags JOIN issue_tags ON tags.id = issue_tags.tag_id GROUP BY tags.id ORDER BY count DESC LIMIT 10').all()
  ]);

  return ok(c, { totals, byCategory: byCategory.results, volume: volume.results, attention: attention.results, trendingTags: tags.results });
});

adminRoutes.get('/issues', async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT issues.*, users.email AS author_email, categories.name AS category_name
     FROM issues
     LEFT JOIN users ON users.id = issues.author_id
     LEFT JOIN categories ON categories.id = issues.category_id
     ORDER BY issues.created_at DESC`
  ).all();
  return ok(c, rows.results);
});

adminRoutes.post('/issues/:id/assign', requireRole('dept_admin'), zValidator('json', z.object({ assigned_to: z.string() })), async (c) => {
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE issues SET assigned_to = ?, updated_at = datetime("now") WHERE id = ?').bind(c.req.valid('json').assigned_to, c.req.param('id')),
    c.env.DB.prepare('INSERT INTO issue_history (id, issue_id, changed_by, field, new_value, note) VALUES (?, ?, ?, "assigned_to", ?, "Issue assigned")').bind(id('hist'), c.req.param('id'), c.get('user').id, c.req.valid('json').assigned_to)
  ]);
  return ok(c, { assigned: true });
});

adminRoutes.get('/users', requireRole('super_admin'), async (c) => {
  const role = c.req.query('role');
  const rows = role
    ? await c.env.DB.prepare('SELECT users.*, COUNT(issues.id) AS issue_count FROM users LEFT JOIN issues ON issues.author_id = users.id WHERE users.role = ? GROUP BY users.id ORDER BY users.created_at DESC').bind(role).all()
    : await c.env.DB.prepare('SELECT users.*, COUNT(issues.id) AS issue_count FROM users LEFT JOIN issues ON issues.author_id = users.id GROUP BY users.id ORDER BY users.created_at DESC').all();
  return ok(c, rows.results);
});

adminRoutes.get('/export', requireRole('dept_admin'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, title, status, priority, department, upvotes, created_at, resolved_at FROM issues ORDER BY created_at DESC').all<Record<string, unknown>>();
  const header = ['id', 'title', 'status', 'priority', 'department', 'upvotes', 'created_at', 'resolved_at'];
  const csv = [header.join(','), ...rows.results.map((row) => header.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="issues.csv"' } });
});

adminRoutes.post('/announcements', requireRole('super_admin'), zValidator('json', z.object({ id: z.string().optional(), title: z.string().min(2), body: z.string().min(2), type: z.enum(['info', 'warning', 'success']).default('info'), is_active: z.boolean().default(true), expires_at: z.string().nullable().optional() })), async (c) => {
  const input = c.req.valid('json');
  const announcementId = input.id ?? id('ann');
  await c.env.DB.prepare(
    'INSERT INTO announcements (id, title, body, type, is_active, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, type = excluded.type, is_active = excluded.is_active, expires_at = excluded.expires_at'
  )
    .bind(announcementId, input.title, input.body, input.type, input.is_active ? 1 : 0, c.get('user').id, input.expires_at ?? null)
    .run();
  return ok(c, { id: announcementId });
});
