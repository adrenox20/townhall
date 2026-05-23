import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { requireAuth } from '../middleware/auth';
import { createObjectKey } from '../services/upload.service';
import { ok } from '../utils/response';
export const uploadRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
uploadRoutes.use('*', requireAuth());
uploadRoutes.post('/presign', zValidator('json', z.object({ filename: z.string(), contentType: z.string(), sizeBytes: z.number().max(50_000_000) })), async (c) => {
  const body = c.req.valid('json');
  const key = createObjectKey(c.get('user').id, body.filename);
  return ok(c, { key, uploadUrl: `/api/v1/uploads/direct/${encodeURIComponent(key)}`, maxSizeBytes: 50_000_000, allowed: ['image/png', 'image/jpeg', 'application/pdf', 'video/mp4'] });
});
uploadRoutes.put('/direct/:key{.+}', async (c) => {
  await c.env.R2.put(c.req.param('key'), c.req.raw.body);
  return ok(c, { uploaded: true });
});
// Serve a file from R2 — authenticated, streams with correct content-type
// Accepts Bearer token via Authorization header OR ?token= query param (needed for <img>/<video> tags)
uploadRoutes.get('/serve/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.R2.get(key);
  if (!object) return c.json({ error: 'Not found' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'private, max-age=3600');
  // Force inline display for images and video; attachment download for PDFs
  const ct = object.httpMetadata?.contentType ?? '';
  if (ct.startsWith('image/') || ct.startsWith('video/')) {
    headers.set('content-disposition', 'inline');
  } else {
    const filename = key.split('/').pop() ?? 'file';
    headers.set('content-disposition', `attachment; filename="${filename}"`);
  }
  return new Response(object.body, { headers });
});
uploadRoutes.delete('/:key{.+}', async (c) => {
  await c.env.R2.delete(c.req.param('key'));
  return ok(c, { deleted: true });
});
