import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { ok } from '../utils/response';
export const departmentRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
departmentRoutes.get('/', async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM departments WHERE is_active = 1 ORDER BY name').all()).results));
