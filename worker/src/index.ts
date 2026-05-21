import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppVariables, Env } from './types/env';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { categoryRoutes } from './routes/categories';
import { commentRoutes } from './routes/comments';
import { councilRoutes } from './routes/council';
import { issueRoutes } from './routes/issues';
import { solutionRoutes } from './routes/solutions';
import { tagRoutes } from './routes/tags';
import { uploadRoutes } from './routes/uploads';
import { userRoutes } from './routes/users';
import { ok } from './lib/response';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => origin || c.env.FRONTEND_URL,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    credentials: true
  })
);

app.get('/api/health', (c) => ok(c, { ok: true, service: 'campus-issues-api' }));
app.get('/api/announcements', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM announcements WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > datetime("now")) ORDER BY created_at DESC'
  ).all();
  return ok(c, rows.results);
});

app.route('/api/auth', authRoutes);
app.route('/api/issues', issueRoutes);
app.route('/api', commentRoutes);
app.route('/api', solutionRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/tags', tagRoutes);
app.route('/api/users', userRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/council', councilRoutes);
app.route('/api/upload', uploadRoutes);

app.notFound((c) => c.json({ error: { message: 'Not found' } }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: { message: error.message || 'Internal server error' } }, 500);
});

export default app;
