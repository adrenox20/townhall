import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/response';
export const userRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
userRoutes.use('*', requireAuth());
userRoutes.get('/me', (c) => ok(c, c.get('user')));
