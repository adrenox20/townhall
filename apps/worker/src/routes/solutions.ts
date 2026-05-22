import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { requireAuth, requirePermission } from '../middleware/auth';
import { solutionRank } from '../services/solution-ranking.service';
import { id } from '../utils/ids';
import { now } from '../utils/dates';
import { created, ok } from '../utils/response';

export const solutionRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
solutionRoutes.use('*', requireAuth());

solutionRoutes.get('/issues/:id/solutions', async (c) => {
  const user = c.get('user');
  const rows = await c.env.DB.prepare('SELECT * FROM solutions WHERE issue_id = ? AND (? = 1 OR status NOT IN ("hidden", "rejected"))')
    .bind(c.req.param('id'), user.permissions.includes('solution:review') ? 1 : 0).all<Record<string, never>>();
  return ok(c, rows.results.map((solution) => ({ ...solution, rank: solutionRank(solution as never) })).sort((a, b) => b.rank - a.rank));
});

solutionRoutes.post('/issues/:id/solutions', zValidator('json', z.object({ body: z.string().min(5) })), async (c) => {
  const solutionId = id('solution');
  await c.env.DB.prepare('INSERT INTO solutions (id, issue_id, author_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(solutionId, c.req.param('id'), c.get('user').id, c.req.valid('json').body, now(), now()).run();
  return created(c, { id: solutionId });
});

solutionRoutes.patch('/solutions/:id', zValidator('json', z.object({ body: z.string().min(5) })), async (c) => {
  await c.env.DB.prepare('UPDATE solutions SET body = ?, updated_at = ? WHERE id = ? AND author_id = ?').bind(c.req.valid('json').body, now(), c.req.param('id'), c.get('user').id).run();
  return ok(c, { updated: true });
});

solutionRoutes.delete('/solutions/:id', async (c) => {
  await c.env.DB.prepare('UPDATE solutions SET status = "hidden", updated_at = ? WHERE id = ?').bind(now(), c.req.param('id')).run();
  return ok(c, { deleted: true });
});

solutionRoutes.post('/solutions/:id/vote', async (c) => {
  await c.env.DB.prepare('INSERT OR IGNORE INTO solution_votes (solution_id, user_id, kind, created_at) VALUES (?, ?, "upvote", ?)').bind(c.req.param('id'), c.get('user').id, now()).run();
  await c.env.DB.prepare('UPDATE solutions SET upvotes = upvotes + 1 WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { voted: true });
});

solutionRoutes.post('/solutions/:id/helpful', async (c) => {
  await c.env.DB.prepare('INSERT OR IGNORE INTO solution_votes (solution_id, user_id, kind, created_at) VALUES (?, ?, "helpful", ?)').bind(c.req.param('id'), c.get('user').id, now()).run();
  await c.env.DB.prepare('UPDATE solutions SET helpful_count = helpful_count + 1 WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { helpful: true });
});

solutionRoutes.patch('/solutions/:id/status', requirePermission('solution:review'), zValidator('json', z.object({ status: z.enum(['proposed', 'under_review', 'verified', 'accepted', 'rejected', 'hidden']) })), async (c) => {
  await c.env.DB.prepare('UPDATE solutions SET status = ?, updated_at = ? WHERE id = ?').bind(c.req.valid('json').status, now(), c.req.param('id')).run();
  return ok(c, { status: c.req.valid('json').status });
});

solutionRoutes.post('/issues/:id/official-solution', requirePermission('solution:official_select'), zValidator('json', z.object({ solutionId: z.string() })), async (c) => {
  const { solutionId } = c.req.valid('json');
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE solutions SET is_official = 0 WHERE issue_id = ?').bind(c.req.param('id')),
    c.env.DB.prepare('UPDATE solutions SET is_official = 1, status = "accepted", updated_at = ? WHERE id = ? AND issue_id = ?').bind(now(), solutionId, c.req.param('id'))
  ]);
  return ok(c, { officialSolutionId: solutionId });
});

solutionRoutes.post('/solutions/:id/pin', requirePermission('solution:review'), async (c) => {
  await c.env.DB.prepare('UPDATE solutions SET is_pinned = 1, updated_at = ? WHERE id = ?').bind(now(), c.req.param('id')).run();
  return ok(c, { pinned: true });
});

solutionRoutes.post('/solutions/:id/hide', requirePermission('solution:review'), async (c) => {
  await c.env.DB.prepare('UPDATE solutions SET status = "hidden", updated_at = ? WHERE id = ?').bind(now(), c.req.param('id')).run();
  return ok(c, { hidden: true });
});
