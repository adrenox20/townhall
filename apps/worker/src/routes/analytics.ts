import { Hono } from 'hono';
import type { Env, Variables } from '../env';
import { requireAuth, requireAnyPermission } from '../middleware/auth';
import { issueMetrics } from '../services/analytics.service';
import { ok } from '../utils/response';

export const analyticsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
analyticsRoutes.use('*', requireAuth(), requireAnyPermission(['analytics:institution_read', 'analytics:platform_read']));
analyticsRoutes.get('/', async (c) => ok(c, await issueMetrics(c)));
