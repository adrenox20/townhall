import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/response';
export const savedFilterRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
savedFilterRoutes.use('*', requireAuth());
savedFilterRoutes.get('/', async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM saved_filters WHERE user_id = ?').bind(c.get('user').id).all()).results));
