import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { requireAnyPermission, requireAuth, requirePermission } from '../middleware/auth';
import { issueMetrics } from '../services/analytics.service';
import { ok } from '../utils/response';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
adminRoutes.use('*', requireAuth(), requireAnyPermission(['analytics:institution_read', 'analytics:platform_read']));
adminRoutes.get('/dashboard', async (c) => ok(c, await issueMetrics(c)));
adminRoutes.get('/analytics', async (c) => ok(c, await issueMetrics(c)));
adminRoutes.get('/sla', async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM issues WHERE sla_due_at < datetime("now") AND status NOT IN ("resolved", "archived", "rejected")').all()).results));
adminRoutes.get('/issues', async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM issues WHERE is_deleted = 0 ORDER BY created_at DESC').all()).results));
adminRoutes.get('/kanban', async (c) => ok(c, (await c.env.DB.prepare('SELECT * FROM issues WHERE is_deleted = 0 ORDER BY created_at DESC').all()).results));
adminRoutes.post('/reports/export', async (c) => ok(c, { url: null, status: 'queued' }));
adminRoutes.all('/:resource{categories|tags|departments}/*?', requirePermission('settings:manage'), async (c) => ok(c, { resource: c.req.param('resource'), managed: true }));
