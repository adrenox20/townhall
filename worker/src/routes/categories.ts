import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env } from '../types/env';
import { id, slugify } from '../lib/ids';
import { fail, ok } from '../lib/response';
import { requireAuth, requireRole } from '../middleware/auth';

export const categoryRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  display_order: z.number().int().optional()
});

categoryRoutes.get('/', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order, name').all();
  return ok(c, rows.results);
});

categoryRoutes.post('/', requireAuth, requireRole('super_admin'), zValidator('json', categorySchema), async (c) => {
  const input = c.req.valid('json');
  const categoryId = id('cat');
  await c.env.DB.prepare(
    'INSERT INTO categories (id, name, slug, description, parent_id, icon, color, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(categoryId, input.name, slugify(input.name), input.description ?? null, input.parent_id ?? null, input.icon ?? null, input.color ?? null, input.display_order ?? 0)
    .run();
  return ok(c, { id: categoryId }, { status: 201 });
});

categoryRoutes.patch('/:id', requireAuth, requireRole('super_admin'), zValidator('json', categorySchema.partial()), async (c) => {
  const input = c.req.valid('json');
  const existing = await c.env.DB.prepare('SELECT id FROM categories WHERE id = ?').bind(c.req.param('id')).first();
  if (!existing) return fail(c, 404, 'Category not found');

  await c.env.DB.prepare(
    'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), parent_id = COALESCE(?, parent_id), icon = COALESCE(?, icon), color = COALESCE(?, color), display_order = COALESCE(?, display_order) WHERE id = ?'
  )
    .bind(input.name ?? null, input.name ? slugify(input.name) : null, input.description ?? null, input.parent_id ?? null, input.icon ?? null, input.color ?? null, input.display_order ?? null, c.req.param('id'))
    .run();
  return ok(c, { updated: true });
});

categoryRoutes.delete('/:id', requireAuth, requireRole('super_admin'), async (c) => {
  await c.env.DB.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { deactivated: true });
});
