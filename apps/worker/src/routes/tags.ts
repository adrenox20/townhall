import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { ok } from '../utils/response';
export const tagRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
tagRoutes.get('/', async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM tags WHERE is_active = 1 ORDER BY name').all()).results));
