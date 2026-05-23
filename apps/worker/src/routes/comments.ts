import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { requireAuth } from '../middleware/auth';
import { id } from '../utils/ids';
import { now } from '../utils/dates';
import { created, fail, ok } from '../utils/response';

export const commentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
commentRoutes.use('*', requireAuth());

/** Resolve UUID from either UUID or public_id */
async function resolveIssueUUID(db: Env['DB'], param: string): Promise<string | null> {
  const row = await db.prepare(
    'SELECT id FROM issues WHERE (id = ? OR public_id = ?) AND is_deleted = 0 LIMIT 1'
  ).bind(param, param).first<{ id: string }>();
  return row?.id ?? null;
}

commentRoutes.get('/issues/:id/comments', async (c) => {
  const issueId = await resolveIssueUUID(c.env.DB, c.req.param('id'));
  if (!issueId) return ok(c, []);

  const user = c.get('user');
  const rows = await c.env.DB.prepare(
    `SELECT cm.*,
      json_object('id', u.id, 'name', u.name, 'avatar_url', u.avatar_url) AS author
     FROM comments cm
     LEFT JOIN users u ON u.id = cm.author_id
     WHERE cm.issue_id = ? AND cm.is_deleted = 0 AND (? = 1 OR cm.is_internal = 0)
     ORDER BY cm.is_pinned DESC, cm.created_at ASC`
  ).bind(issueId, user.permissions.includes('comment:moderate') ? 1 : 0).all<Record<string, unknown>>();

  return ok(c, rows.results.map(row => ({
    ...row,
    author: (() => { try { return JSON.parse(row.author as string); } catch { return null; } })(),
  })));
});

commentRoutes.post('/issues/:id/comments', zValidator('json', z.object({ body: z.string().min(1), isInternal: z.boolean().default(false), is_internal: z.boolean().optional(), isOfficial: z.boolean().default(false) })), async (c) => {
  const issueId = await resolveIssueUUID(c.env.DB, c.req.param('id'));
  if (!issueId) return fail(c, 'NOT_FOUND', 'Issue not found', 404);

  const body = c.req.valid('json');
  const commentId = id('comment');
  const isInternal = body.isInternal || body.is_internal || false;
  await c.env.DB.prepare('INSERT INTO comments (id, issue_id, author_id, body, is_internal, is_official, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(commentId, issueId, c.get('user').id, body.body, isInternal ? 1 : 0, body.isOfficial ? 1 : 0, now(), now()).run();
  return created(c, { id: commentId });
});

commentRoutes.patch('/comments/:id', zValidator('json', z.object({ body: z.string().min(1) })), async (c) => {
  await c.env.DB.prepare('UPDATE comments SET body = ?, updated_at = ? WHERE id = ? AND author_id = ?').bind(c.req.valid('json').body, now(), c.req.param('id'), c.get('user').id).run();
  return ok(c, { updated: true });
});

commentRoutes.delete('/comments/:id', async (c) => {
  await c.env.DB.prepare('UPDATE comments SET is_deleted = 1, updated_at = ? WHERE id = ?').bind(now(), c.req.param('id')).run();
  return ok(c, { deleted: true });
});

commentRoutes.post('/comments/:id/pin', async (c) => {
  await c.env.DB.prepare('UPDATE comments SET is_pinned = 1, updated_at = ? WHERE id = ?').bind(now(), c.req.param('id')).run();
  return ok(c, { pinned: true });
});

commentRoutes.post('/comments/:id/moderate', zValidator('json', z.object({ hidden: z.boolean() })), async (c) => {
  await c.env.DB.prepare('UPDATE comments SET is_deleted = ?, updated_at = ? WHERE id = ?').bind(c.req.valid('json').hidden ? 1 : 0, now(), c.req.param('id')).run();
  return ok(c, { moderated: true });
});
