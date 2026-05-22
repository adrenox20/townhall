import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/response';
export const notificationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
notificationRoutes.use('*', requireAuth());
notificationRoutes.get('/', async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(c.get('user').id).all()).results));
notificationRoutes.patch('/read', async (c) => {
  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').bind(c.get('user').id).run();
  return ok(c, { read: true });
});
notificationRoutes.post('/test', async (c) => ok(c, { queued: true }));
