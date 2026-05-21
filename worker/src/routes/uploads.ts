import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env } from '../types/env';
import { id } from '../lib/ids';
import { ok } from '../lib/response';
import { requireAuth } from '../middleware/auth';

export const uploadRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

uploadRoutes.use('*', requireAuth);

uploadRoutes.post('/presign', zValidator('json', z.object({ filename: z.string().min(1), contentType: z.string().min(1) })), async (c) => {
  if (!c.env.R2) return c.json({ error: { message: 'R2 is not configured for this deployment' } }, 503);
  const { filename, contentType } = c.req.valid('json');
  const ext = filename.includes('.') ? `.${filename.split('.').pop()}` : '';
  const key = `${c.get('user').id}/${id('att')}${ext}`;

  return ok(c, {
    key,
    contentType,
    uploadUrl: `/api/upload/direct/${encodeURIComponent(key)}`,
    note: 'Cloudflare Workers cannot generate generic R2 presigned URLs without S3 credentials. This endpoint returns a Worker direct-upload URL.'
  });
});

uploadRoutes.put('/direct/:key{.+}', async (c) => {
  if (!c.env.R2) return c.json({ error: { message: 'R2 is not configured for this deployment' } }, 503);
  const key = c.req.param('key');
  await c.env.R2.put(key, c.req.raw.body, { httpMetadata: { contentType: c.req.header('content-type') ?? 'application/octet-stream' } });
  return ok(c, { key });
});

uploadRoutes.delete('/:key{.+}', async (c) => {
  if (!c.env.R2) return c.json({ error: { message: 'R2 is not configured for this deployment' } }, 503);
  await c.env.R2.delete(c.req.param('key'));
  return ok(c, { deleted: true });
});
