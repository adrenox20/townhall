import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { requireAuth } from '../middleware/auth';
import { id } from '../utils/ids';
import { now } from '../utils/dates';
import { created, ok } from '../utils/response';

export const commentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
commentRoutes.use('*', requireAuth());

commentRoutes.get('/issues/:id/comments', async (c) => {
  const user = c.get('user');
  const rows = await c.env.DB.prepare('SELECT * FROM comments WHERE issue_id = ? AND is_deleted = 0 AND (? = 1 OR is_internal = 0) ORDER BY is_pinned DESC, created_at ASC')
    .bind(c.req.param('id'), user.permissions.includes('comment:moderate') ? 1 : 0).all();
  return ok(c, rows.results);
});

commentRoutes.post('/issues/:id/comments', zValidator('json', z.object({ body: z.string().min(1), isInternal: z.boolean().default(false), isOfficial: z.boolean().default(false) })), async (c) => {
  const body = c.req.valid('json');
  const commentId = id('comment');
  await c.env.DB.prepare('INSERT INTO comments (id, issue_id, author_id, body, is_internal, is_official, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(commentId, c.req.param('id'), c.get('user').id, body.body, body.isInternal ? 1 : 0, body.isOfficial ? 1 : 0, now(), now()).run();
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
