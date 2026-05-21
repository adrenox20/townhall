import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env } from '../types/env';
import { id } from '../lib/ids';
import { fail, ok } from '../lib/response';
import { isAdmin, isCouncilOrAdmin, requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

export const solutionRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// GET /api/issues/:id/solutions
solutionRoutes.get('/issues/:id/solutions', async (c) => {
  const sort = c.req.query('sort') ?? 'votes';
  const orderBy = sort === 'new' ? 'solutions.created_at DESC' : 'solutions.upvotes DESC, solutions.created_at DESC';
  const rows = await c.env.DB.prepare(
    `SELECT solutions.*, users.name AS author_name, users.avatar_url AS author_avatar
     FROM solutions
     LEFT JOIN users ON users.id = solutions.author_id
     WHERE solutions.issue_id = ? AND solutions.is_deleted = 0
     ORDER BY
       CASE WHEN solutions.status = 'council_recommended' THEN 0 ELSE 1 END,
       CASE WHEN solutions.status IN ('being_implemented','implemented') THEN 0 ELSE 1 END,
       ${orderBy}`
  ).bind(c.req.param('id')).all();
  return ok(c, rows.results);
});

// POST /api/issues/:id/solutions
solutionRoutes.post(
  '/issues/:id/solutions',
  requireAuth,
  rateLimit('solution-create', 10, 3600),
  zValidator('json', z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(10).max(2000),
    effort: z.enum(['quick_fix', 'medium', 'large_project']).optional(),
    cost_estimate: z.string().max(100).optional()
  })),
  async (c) => {
    const input = c.req.valid('json');
    const user = c.get('user');
    const issueId = c.req.param('id');

    const issue = await c.env.DB.prepare('SELECT id, solution_count FROM issues WHERE id = ?').bind(issueId).first<{ id: string; solution_count: number }>();
    if (!issue) return fail(c, 404, 'Issue not found');

    const max = Number(c.env.SOLUTION_MAX_PER_ISSUE ?? '20');
    if ((issue.solution_count ?? 0) >= max) return fail(c, 400, `Maximum ${max} solutions per issue`);

    const solId = id('sol');
    await c.env.DB.prepare(
      'INSERT INTO solutions (id, issue_id, author_id, title, description, effort, cost_estimate) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(solId, issueId, user.id, input.title, input.description, input.effort ?? null, input.cost_estimate ?? null).run();

    return ok(c, { id: solId }, { status: 201 });
  }
);

// PATCH /api/solutions/:id
solutionRoutes.patch(
  '/solutions/:id',
  requireAuth,
  zValidator('json', z.object({
    title: z.string().min(5).max(100).optional(),
    description: z.string().min(10).max(2000).optional(),
    effort: z.enum(['quick_fix', 'medium', 'large_project']).nullable().optional(),
    cost_estimate: z.string().max(100).nullable().optional()
  })),
  async (c) => {
    const user = c.get('user');
    const sol = await c.env.DB.prepare('SELECT author_id, created_at FROM solutions WHERE id = ? AND is_deleted = 0').bind(c.req.param('id')).first<{ author_id: string; created_at: string }>();
    if (!sol) return fail(c, 404, 'Solution not found');

    const canEdit = sol.author_id === user.id && Date.now() - new Date(sol.created_at).getTime() < 30 * 60 * 1000;
    if (!canEdit && !isAdmin(user.role)) return fail(c, 403, 'You can only edit your own solution within 30 minutes');

    const input = c.req.valid('json');
    await c.env.DB.prepare(
      'UPDATE solutions SET title = COALESCE(?, title), description = COALESCE(?, description), effort = COALESCE(?, effort), cost_estimate = COALESCE(?, cost_estimate), updated_at = datetime("now") WHERE id = ?'
    ).bind(input.title ?? null, input.description ?? null, input.effort ?? null, input.cost_estimate ?? null, c.req.param('id')).run();
    return ok(c, { updated: true });
  }
);

// DELETE /api/solutions/:id
solutionRoutes.delete('/solutions/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const sol = await c.env.DB.prepare('SELECT author_id FROM solutions WHERE id = ? AND is_deleted = 0').bind(c.req.param('id')).first<{ author_id: string }>();
  if (!sol) return fail(c, 404, 'Solution not found');
  if (sol.author_id !== user.id && !isAdmin(user.role)) return fail(c, 403, 'Cannot delete this solution');

  await c.env.DB.prepare('UPDATE solutions SET is_deleted = 1, updated_at = datetime("now") WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { deleted: true });
});

// POST /api/solutions/:id/vote
solutionRoutes.post(
  '/solutions/:id/vote',
  requireAuth,
  rateLimit('solution-vote', 100, 3600),
  zValidator('json', z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) })),
  async (c) => {
    const { value } = c.req.valid('json');
    const user = c.get('user');
    const solId = c.req.param('id');

    if (value === 0) {
      await c.env.DB.prepare('DELETE FROM solution_votes WHERE user_id = ? AND solution_id = ?').bind(user.id, solId).run();
    } else {
      await c.env.DB.prepare(
        'INSERT INTO solution_votes (solution_id, user_id, value) VALUES (?, ?, ?) ON CONFLICT(solution_id, user_id) DO UPDATE SET value = excluded.value'
      ).bind(solId, user.id, value).run();
    }
    await c.env.DB.prepare(
      'UPDATE solutions SET upvotes = (SELECT COUNT(*) FROM solution_votes WHERE solution_id = ? AND value = 1), downvotes = (SELECT COUNT(*) FROM solution_votes WHERE solution_id = ? AND value = -1), updated_at = datetime("now") WHERE id = ?'
    ).bind(solId, solId, solId).run();

    const row = await c.env.DB.prepare('SELECT upvotes, downvotes FROM solutions WHERE id = ?').bind(solId).first();
    return ok(c, row);
  }
);

// POST /api/solutions/:id/recommend — student_council+
solutionRoutes.post(
  '/solutions/:id/recommend',
  requireAuth,
  zValidator('json', z.object({ council_note: z.string().min(5).optional() })),
  async (c) => {
    const user = c.get('user');
    if (!isCouncilOrAdmin(user.role)) return fail(c, 403, 'Only Student Council can mark recommendations');

    const sol = await c.env.DB.prepare('SELECT id, status FROM solutions WHERE id = ? AND is_deleted = 0').bind(c.req.param('id')).first<{ id: string; status: string }>();
    if (!sol) return fail(c, 404, 'Solution not found');

    const newStatus = sol.status === 'council_recommended' ? 'proposed' : 'council_recommended';
    await c.env.DB.prepare(
      'UPDATE solutions SET status = ?, council_note = ?, council_reviewer_id = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(newStatus, c.req.valid('json').council_note ?? null, user.id, c.req.param('id')).run();
    return ok(c, { status: newStatus });
  }
);

// POST /api/solutions/:id/implement — dept_admin+
solutionRoutes.post(
  '/solutions/:id/implement',
  requireAuth,
  requireRole('dept_admin'),
  zValidator('json', z.object({
    status: z.enum(['being_implemented', 'implemented', 'rejected']),
    admin_note: z.string().min(5).optional()
  })),
  async (c) => {
    const { status, admin_note } = c.req.valid('json');
    await c.env.DB.prepare(
      'UPDATE solutions SET status = ?, admin_note = ?, admin_reviewer_id = ?, updated_at = datetime("now") WHERE id = ? AND is_deleted = 0'
    ).bind(status, admin_note ?? null, c.get('user').id, c.req.param('id')).run();
    return ok(c, { status });
  }
);
