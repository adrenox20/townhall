import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { requireAuth } from '../middleware/auth';
import { createObjectKey } from '../services/upload.service';
import { ok } from '../utils/response';
export const uploadRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
uploadRoutes.use('*', requireAuth());
uploadRoutes.post('/presign', zValidator('json', z.object({ filename: z.string(), contentType: z.string(), sizeBytes: z.number().max(10_000_000) })), async (c) => {
  const body = c.req.valid('json');
  const key = createObjectKey(c.get('user').id, body.filename);
  return ok(c, { key, uploadUrl: `/api/v1/uploads/direct/${encodeURIComponent(key)}`, maxSizeBytes: 10_000_000, allowed: ['image/png', 'image/jpeg', 'application/pdf'] });
});
uploadRoutes.put('/direct/:key{.+}', async (c) => {
  await c.env.R2.put(c.req.param('key'), c.req.raw.body);
  return ok(c, { uploaded: true });
});
uploadRoutes.delete('/:key{.+}', async (c) => {
  await c.env.R2.delete(c.req.param('key'));
  return ok(c, { deleted: true });
});
