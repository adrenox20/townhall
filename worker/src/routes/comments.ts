import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env } from '../types/env';
import { id } from '../lib/ids';
import { fail, ok } from '../lib/response';
import { isAdmin, requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

export const commentRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const commentSchema = z.object({
  body: z.string().min(2),
  parent_id: z.string().nullable().optional(),
  is_official_update: z.boolean().default(false),
  is_internal_note: z.boolean().default(false),
  attachment_keys: z.array(z.string()).default([])
});

commentRoutes.get('/issues/:id/comments', requireAuth, async (c) => {
  const admin = isAdmin(c.get('user').role);
  const rows = await c.env.DB.prepare(
    `SELECT comments.*, users.name AS author_name, users.avatar_url AS author_avatar
     FROM comments LEFT JOIN users ON users.id = comments.author_id
     WHERE comments.issue_id = ? AND comments.is_deleted = 0 ${admin ? '' : 'AND comments.is_internal_note = 0'}
     ORDER BY comments.is_pinned DESC, comments.created_at ASC`
  )
    .bind(c.req.param('id'))
    .all();
  return ok(c, rows.results);
});

commentRoutes.post('/issues/:id/comments', requireAuth, rateLimit('comment', 20, 3600), zValidator('json', commentSchema), async (c) => {
  const input = c.req.valid('json');
  const user = c.get('user');
  if (input.is_internal_note && !isAdmin(user.role)) return fail(c, 403, 'Only admins can add internal notes');
  if (input.is_official_update && !['dept_admin', 'super_admin'].includes(user.role)) return fail(c, 403, 'Only department admins can post official updates');

  const issue = await c.env.DB.prepare('SELECT author_id, is_locked FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ author_id: string; is_locked: number }>();
  if (!issue) return fail(c, 404, 'Issue not found');
  if (issue.is_locked && !isAdmin(user.role)) return fail(c, 403, 'This issue is locked');

  const commentId = id('com');
  await c.env.DB.batch([
    c.env.DB.prepare(
      'INSERT INTO comments (id, issue_id, author_id, parent_id, body, is_official_update, is_internal_note, attachment_keys) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(commentId, c.req.param('id'), user.id, input.parent_id ?? null, input.body, input.is_official_update ? 1 : 0, input.is_internal_note ? 1 : 0, JSON.stringify(input.attachment_keys)),
    c.env.DB.prepare('INSERT INTO notifications (id, user_id, type, issue_id, comment_id, message) VALUES (?, ?, ?, ?, ?, ?)').bind(
      id('not'),
      issue.author_id,
      input.is_official_update ? 'official_update' : 'new_comment',
      c.req.param('id'),
      commentId,
      input.is_official_update ? 'An official update was posted on your issue' : 'A new comment was posted on your issue'
    )
  ]);
  return ok(c, { id: commentId }, { status: 201 });
});

commentRoutes.patch('/comments/:id', requireAuth, zValidator('json', z.object({ body: z.string().min(2) })), async (c) => {
  const comment = await c.env.DB.prepare('SELECT author_id FROM comments WHERE id = ?').bind(c.req.param('id')).first<{ author_id: string }>();
  if (!comment) return fail(c, 404, 'Comment not found');
  if (comment.author_id !== c.get('user').id && !isAdmin(c.get('user').role)) return fail(c, 403, 'Cannot edit this comment');

  await c.env.DB.prepare('UPDATE comments SET body = ?, is_edited = 1, updated_at = datetime("now") WHERE id = ?').bind(c.req.valid('json').body, c.req.param('id')).run();
  return ok(c, { updated: true });
});

commentRoutes.delete('/comments/:id', requireAuth, async (c) => {
  const comment = await c.env.DB.prepare('SELECT author_id FROM comments WHERE id = ?').bind(c.req.param('id')).first<{ author_id: string }>();
  if (!comment) return fail(c, 404, 'Comment not found');
  if (comment.author_id !== c.get('user').id && !isAdmin(c.get('user').role)) return fail(c, 403, 'Cannot delete this comment');

  await c.env.DB.prepare('UPDATE comments SET is_deleted = 1, updated_at = datetime("now") WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { deleted: true });
});

commentRoutes.post('/comments/:id/pin', requireAuth, requireRole('moderator'), async (c) => {
  await c.env.DB.prepare('UPDATE comments SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { toggled: true });
});
