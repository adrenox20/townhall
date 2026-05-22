import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { requireAuth } from '../middleware/auth';
import { reportContent } from '../services/moderation.service';
import { ok } from '../utils/response';
export const moderationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
moderationRoutes.use('*', requireAuth());
moderationRoutes.post('/report', zValidator('json', z.object({ entityType: z.string(), entityId: z.string(), reason: z.string() })), async (c) => {
  const body = c.req.valid('json');
  await reportContent(c, body.entityType, body.entityId, body.reason);
  return ok(c, { reported: true });
});
