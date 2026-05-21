import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env } from '../types/env';
import { id, slugify } from '../lib/ids';
import { ok } from '../lib/response';
import { requireAuth, requireRole } from '../middleware/auth';

export const tagRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

tagRoutes.get('/', async (c) => {
  const tags = await c.env.DB.prepare(
    'SELECT tags.*, COUNT(issue_tags.issue_id) AS usage_count FROM tags LEFT JOIN issue_tags ON tags.id = issue_tags.tag_id GROUP BY tags.id ORDER BY tags.name'
  ).all();
  return ok(c, tags.results);
});

tagRoutes.post('/', requireAuth, requireRole('moderator'), zValidator('json', z.object({ name: z.string().min(2), color: z.string().optional() })), async (c) => {
  const { name, color } = c.req.valid('json');
  const tagId = id('tag');
  await c.env.DB.prepare('INSERT INTO tags (id, name, slug, color) VALUES (?, ?, ?, ?)').bind(tagId, name, slugify(name), color ?? null).run();
  return ok(c, { id: tagId }, { status: 201 });
});

tagRoutes.delete('/:id', requireAuth, requireRole('super_admin'), async (c) => {
  await c.env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { deleted: true });
});
