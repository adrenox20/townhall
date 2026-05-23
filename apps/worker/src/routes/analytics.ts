import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { requireAuth, requireAnyPermission } from '../middleware/auth';
import { issueMetrics } from '../services/analytics.service';
import { ok } from '../utils/response';

export const analyticsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
analyticsRoutes.use('*', requireAuth());

// Public summary — any authenticated user can see aggregate counts
analyticsRoutes.get('/summary', async (c) => {
  const totals = await c.env.DB.prepare(
    'SELECT COUNT(*) total, SUM(status = "resolved") resolved, SUM(status = "in_progress" OR status = "under_investigation") in_progress FROM issues WHERE is_deleted = 0 AND master_issue_id IS NULL'
  ).first<{ total: number; resolved: number; in_progress: number }>();
  return ok(c, { total: totals?.total ?? 0, resolved: totals?.resolved ?? 0, in_progress: totals?.in_progress ?? 0 });
});

analyticsRoutes.use('/', requireAnyPermission(['analytics:institution_read', 'analytics:platform_read']));
analyticsRoutes.get('/', async (c) => ok(c, await issueMetrics(c)));
