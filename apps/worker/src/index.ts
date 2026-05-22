import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env, Variables } from './env';
import { adminRoutes } from './routes/admin';
import { analyticsRoutes } from './routes/analytics';
import { authRoutes } from './routes/auth';
import { categoryRoutes } from './routes/categories';
import { commentRoutes } from './routes/comments';
import { departmentRoutes } from './routes/departments';
import { issueRoutes } from './routes/issues';
import { moderationRoutes } from './routes/moderation';
import { notificationRoutes } from './routes/notifications';
import { openApiRoutes } from './routes/openapi';
import { portalRoutes } from './routes/portal';
import { savedFilterRoutes } from './routes/saved-filters';
import { solutionRoutes } from './routes/solutions';
import { tagRoutes } from './routes/tags';
import { uploadRoutes } from './routes/uploads';
import { userRoutes } from './routes/users';
import { IssueRoom } from './durable-objects/issue-room';
import { NotificationHub } from './durable-objects/notification-hub';
import { notificationConsumer } from './queues/notification-consumer';
import { requestContext } from './middleware/errors';
import { securityHeaders } from './middleware/security';
import { ok } from './utils/response';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', requestContext);
app.use('*', logger());
app.use('*', securityHeaders);
app.use('*', cors({
  origin: (origin, c) => origin || c.env.FRONTEND_URL,
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  credentials: true
}));

app.get('/api/health', (c) => ok(c, { ok: true, service: 'university-grievance-api' }));
app.get('/api/v1/health', (c) => ok(c, { ok: true, service: 'university-grievance-api' }));
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/issues', issueRoutes);
app.route('/api/v1', commentRoutes);
app.route('/api/v1', solutionRoutes);
app.route('/api/v1/categories', categoryRoutes);
app.route('/api/v1/tags', tagRoutes);
app.route('/api/v1/departments', departmentRoutes);
app.route('/api/v1/users', userRoutes);
app.route('/api/v1/admin', adminRoutes);
app.route('/api/v1/portal', portalRoutes);
app.route('/api/v1/notifications', notificationRoutes);
app.route('/api/v1/uploads', uploadRoutes);
app.get('/api/v1/attachments/:id', async (c) => ok(c, await c.env.DB.prepare('SELECT * FROM attachments WHERE id = ?').bind(c.req.param('id')).first()));
app.route('/api/v1/analytics', analyticsRoutes);
app.route('/api/v1/moderation', moderationRoutes);
app.route('/api/v1/saved-filters', savedFilterRoutes);
app.route('/api/v1', openApiRoutes);

app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Not found', details: {} } }, 404));
app.onError((error: Error & { code?: string; status?: number }, c) => {
  console.error(error);
  return c.json({ error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Internal server error', details: {} } }, (error.status || 500) as never);
});

export { IssueRoom, NotificationHub };
export default {
  fetch: app.fetch,
  queue: notificationConsumer
};
