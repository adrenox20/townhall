import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env, User } from '../types/env';
import { id } from '../lib/ids';
import { fail, ok } from '../lib/response';
import { isAdmin, isCouncilOrAdmin, requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const priorities = ['low', 'medium', 'high', 'critical'] as const;

// Status transitions that dept_admin+ can trigger via /status endpoint
const adminTransitions: Record<string, string[]> = {
  validated: ['under_review'],
  under_review: ['accepted', 'wont_fix'],
  accepted: ['in_progress'],
  in_progress: ['resolved', 'wont_fix'],
  resolved: ['closed', 'in_progress'],
  closed: ['in_progress'],
  wont_fix: ['under_review']
};

export const issueRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

function issueSelect(admin: boolean) {
  const authorName = admin
    ? 'users.name'
    : "CASE WHEN issues.is_anonymous = 1 THEN 'Anonymous Student' ELSE users.name END";
  const authorAvatar = admin
    ? 'users.avatar_url'
    : 'CASE WHEN issues.is_anonymous = 1 THEN NULL ELSE users.avatar_url END';
  return `issues.*, categories.name AS category_name, categories.color AS category_color, ${authorName} AS author_name, ${authorAvatar} AS author_avatar`;
}

// GET /api/issues — public feed shows only validated+ statuses
issueRoutes.get('/', async (c) => {
  const user = await maybeUser(c.env, c.req.header('Authorization') ?? null);
  const admin = Boolean(user && isCouncilOrAdmin(user.role));
  const clauses: string[] = ['1=1'];
  const binds: unknown[] = [];

  const status = c.req.query('status');
  const category = c.req.query('category');
  const search = c.req.query('search');
  const sort = c.req.query('sort') ?? 'new';
  const page = Math.max(Number(c.req.query('page') ?? '1'), 1);
  const limit = Math.min(Number(c.req.query('limit') ?? '20'), 50);

  if (!admin) {
    clauses.push("issues.status IN ('validated','under_review','accepted','in_progress','resolved','closed','wont_fix')");
  }

  if (status) {
    clauses.push(`issues.status IN (${status.split(',').map(() => '?').join(',')})`);
    binds.push(...status.split(','));
  }
  if (category) { clauses.push('issues.category_id = ?'); binds.push(category); }
  if (search) {
    clauses.push('issues.rowid IN (SELECT rowid FROM issues_fts WHERE issues_fts MATCH ?)');
    binds.push(search.replace(/"/g, ''));
  }

  const orderBy = sort === 'top'
    ? 'issues.upvotes DESC'
    : sort === 'trending'
    ? 'issues.trending_score DESC, issues.upvotes DESC'
    : 'issues.created_at DESC';

  const rows = await c.env.DB.prepare(
    `SELECT ${issueSelect(Boolean(user && isAdmin(user.role)))},
      (SELECT COUNT(*) FROM comments WHERE comments.issue_id = issues.id AND comments.is_deleted = 0) AS comment_count
     FROM issues
     LEFT JOIN categories ON categories.id = issues.category_id
     LEFT JOIN users ON users.id = issues.author_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY issues.is_pinned DESC, ${orderBy}
     LIMIT ? OFFSET ?`
  ).bind(...binds, limit, (page - 1) * limit).all();

  return ok(c, { items: rows.results, page, limit });
});

// POST /api/issues — create issue
issueRoutes.post(
  '/',
  requireAuth,
  rateLimit('issue-create', 5, 3600),
  zValidator('json', z.object({
    title: z.string().min(10),
    description: z.string().min(20),
    category_id: z.string().optional(),
    priority_suggestion: z.enum(priorities).default('medium'),
    department: z.string().optional(),
    is_anonymous: z.boolean().default(false),
    tag_ids: z.array(z.string()).default([]),
    attachment_keys: z.array(z.string()).default([]),
    affected_audience: z.string().optional(),
    proposed_solution: z.string().max(500).optional()
  })),
  async (c) => {
    const input = c.req.valid('json');
    const user = c.get('user');
    const issueId = id('iss');

    const ops = [
      c.env.DB.prepare(
        'INSERT INTO issues (id, title, description, category_id, author_id, priority_suggestion, department, is_anonymous, attachment_keys, affected_audience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(issueId, input.title, input.description, input.category_id ?? null, user.id, input.priority_suggestion, input.department ?? null, input.is_anonymous ? 1 : 0, JSON.stringify(input.attachment_keys), input.affected_audience ?? null),
      ...input.tag_ids.map((tagId) =>
        c.env.DB.prepare('INSERT OR IGNORE INTO issue_tags (issue_id, tag_id) VALUES (?, ?)').bind(issueId, tagId)
      ),
      c.env.DB.prepare(
        'INSERT INTO issue_history (id, issue_id, changed_by, field, new_value, note) VALUES (?, ?, ?, "status", "submitted", ?)'
      ).bind(id('hist'), issueId, user.id, 'Issue submitted')
    ];

    if (input.proposed_solution) {
      const solId = id('sol');
      ops.push(
        c.env.DB.prepare(
          'INSERT INTO solutions (id, issue_id, author_id, title, description) VALUES (?, ?, ?, ?, ?)'
        ).bind(solId, issueId, user.id, 'Proposed solution', input.proposed_solution)
      );
    }

    await c.env.DB.batch(ops);
    return ok(c, { id: issueId }, { status: 201 });
  }
);

// GET /api/issues/:id
issueRoutes.get('/:id', async (c) => {
  const user = await maybeUser(c.env, c.req.header('Authorization') ?? null);
  const admin = Boolean(user && isAdmin(user.role));
  const council = Boolean(user && isCouncilOrAdmin(user.role));

  const issue = await c.env.DB.prepare(
    `SELECT ${issueSelect(admin)} FROM issues
     LEFT JOIN categories ON categories.id = issues.category_id
     LEFT JOIN users ON users.id = issues.author_id
     WHERE issues.id = ?`
  ).bind(c.req.param('id')).first();
  if (!issue) return fail(c, 404, 'Issue not found');

  await c.env.DB.prepare('UPDATE issues SET view_count = view_count + 1 WHERE id = ?').bind(c.req.param('id')).run();

  const [comments, history, tags, solutions] = await Promise.all([
    c.env.DB.prepare(
      `SELECT comments.*, users.name AS author_name, users.avatar_url AS author_avatar
       FROM comments LEFT JOIN users ON users.id = comments.author_id
       WHERE comments.issue_id = ? AND comments.is_deleted = 0 ${admin ? '' : 'AND comments.is_internal_note = 0'}
       ORDER BY comments.is_pinned DESC, comments.created_at ASC`
    ).bind(c.req.param('id')).all(),
    c.env.DB.prepare(
      'SELECT issue_history.*, users.name AS changed_by_name FROM issue_history LEFT JOIN users ON users.id = issue_history.changed_by WHERE issue_id = ? ORDER BY created_at DESC'
    ).bind(c.req.param('id')).all(),
    c.env.DB.prepare(
      'SELECT tags.* FROM tags JOIN issue_tags ON tags.id = issue_tags.tag_id WHERE issue_tags.issue_id = ?'
    ).bind(c.req.param('id')).all(),
    c.env.DB.prepare(
      `SELECT solutions.*, users.name AS author_name, users.avatar_url AS author_avatar
       FROM solutions LEFT JOIN users ON users.id = solutions.author_id
       WHERE solutions.issue_id = ? AND solutions.is_deleted = 0
       ORDER BY CASE WHEN solutions.status = 'council_recommended' THEN 0 ELSE 1 END, solutions.upvotes DESC`
    ).bind(c.req.param('id')).all()
  ]);

  return ok(c, {
    issue,
    comments: comments.results,
    history: history.results,
    tags: tags.results,
    solutions: solutions.results
  });
});

// PATCH /api/issues/:id — edit own issue (30min) or admin anytime
issueRoutes.patch(
  '/:id',
  requireAuth,
  zValidator('json', z.object({
    title: z.string().min(10).optional(),
    description: z.string().min(20).optional(),
    priority: z.enum(priorities).optional(),
    category_id: z.string().nullable().optional()
  })),
  async (c) => {
    const user = c.get('user');
    const issue = await c.env.DB.prepare('SELECT * FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ author_id: string; created_at: string }>();
    if (!issue) return fail(c, 404, 'Issue not found');

    const canEditOwn = issue.author_id === user.id && Date.now() - new Date(issue.created_at).getTime() < 30 * 60 * 1000;
    if (!canEditOwn && !isAdmin(user.role)) return fail(c, 403, 'You can only edit your own issue within 30 minutes');

    const input = c.req.valid('json');
    await c.env.DB.prepare(
      'UPDATE issues SET title = COALESCE(?, title), description = COALESCE(?, description), priority = COALESCE(?, priority), category_id = COALESCE(?, category_id), updated_at = datetime("now") WHERE id = ?'
    ).bind(input.title ?? null, input.description ?? null, input.priority ?? null, input.category_id ?? null, c.req.param('id')).run();
    return ok(c, { updated: true });
  }
);

// DELETE /api/issues/:id — close (dept_admin+)
issueRoutes.delete('/:id', requireAuth, requireRole('dept_admin'), async (c) => {
  await c.env.DB.prepare('UPDATE issues SET status = "closed", updated_at = datetime("now") WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { closed: true });
});

// PATCH /api/issues/:id/status — admin status transitions (validated → under_review → ... → closed)
issueRoutes.patch(
  '/:id/status',
  requireAuth,
  requireRole('dept_admin'),
  zValidator('json', z.object({ status: z.string(), note: z.string().min(5) })),
  async (c) => {
    const { status, note } = c.req.valid('json');
    const issue = await c.env.DB.prepare('SELECT status, author_id FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ status: string; author_id: string }>();
    if (!issue) return fail(c, 404, 'Issue not found');

    const allowed = adminTransitions[issue.status];
    if (!allowed?.includes(status)) return fail(c, 400, `Transition from "${issue.status}" to "${status}" is not allowed`);

    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE issues SET status = ?, updated_at = datetime("now"), resolved_at = CASE WHEN ? = "resolved" THEN datetime("now") ELSE resolved_at END WHERE id = ?'
      ).bind(status, status, c.req.param('id')),
      c.env.DB.prepare(
        'INSERT INTO issue_history (id, issue_id, changed_by, field, old_value, new_value, note) VALUES (?, ?, ?, "status", ?, ?, ?)'
      ).bind(id('hist'), c.req.param('id'), c.get('user').id, issue.status, status, note),
      c.env.DB.prepare(
        'INSERT INTO notifications (id, user_id, type, issue_id, message) VALUES (?, ?, "status_change", ?, ?)'
      ).bind(id('not'), issue.author_id, c.req.param('id'), `Your issue moved to ${status.replaceAll('_', ' ')}`)
    ]);
    return ok(c, { status });
  }
);

// POST /api/issues/:id/take-review — SC takes submitted → under_council_review
issueRoutes.post(
  '/:id/take-review',
  requireAuth,
  zValidator('json', z.object({ note: z.string().min(5).optional() })),
  async (c) => {
    const user = c.get('user');
    if (!isCouncilOrAdmin(user.role)) return fail(c, 403, 'Only Student Council can take issues for review');

    const issue = await c.env.DB.prepare('SELECT status, author_id FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ status: string; author_id: string }>();
    if (!issue) return fail(c, 404, 'Issue not found');
    if (issue.status !== 'submitted') return fail(c, 400, 'Only submitted issues can be taken for review');

    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE issues SET status = "under_council_review", updated_at = datetime("now") WHERE id = ?'
      ).bind(c.req.param('id')),
      c.env.DB.prepare(
        'INSERT INTO issue_history (id, issue_id, changed_by, field, old_value, new_value, note) VALUES (?, ?, ?, "status", "submitted", "under_council_review", ?)'
      ).bind(id('hist'), c.req.param('id'), user.id, c.req.valid('json').note ?? 'Taken for council review')
    ]);
    return ok(c, { status: 'under_council_review' });
  }
);

// POST /api/issues/:id/validate — SC validates (submitted or under_council_review → validated)
issueRoutes.post(
  '/:id/validate',
  requireAuth,
  zValidator('json', z.object({
    priority: z.enum(priorities),
    department: z.string().min(1),
    council_note: z.string().min(10)
  })),
  async (c) => {
    const user = c.get('user');
    if (!isCouncilOrAdmin(user.role)) return fail(c, 403, 'Only Student Council can validate issues');

    const issue = await c.env.DB.prepare('SELECT status, author_id FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ status: string; author_id: string }>();
    if (!issue) return fail(c, 404, 'Issue not found');
    if (!['submitted', 'under_council_review'].includes(issue.status)) {
      return fail(c, 400, 'Only submitted or under-review issues can be validated');
    }

    const { priority, department, council_note } = c.req.valid('json');
    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE issues SET status = "validated", priority = ?, department = ?, council_note = ?, council_reviewer_id = ?, council_reviewed_at = datetime("now"), updated_at = datetime("now") WHERE id = ?'
      ).bind(priority, department, council_note, user.id, c.req.param('id')),
      c.env.DB.prepare(
        'INSERT INTO issue_history (id, issue_id, changed_by, field, old_value, new_value, note) VALUES (?, ?, ?, "status", ?, "validated", ?)'
      ).bind(id('hist'), c.req.param('id'), user.id, issue.status, council_note),
      c.env.DB.prepare(
        'INSERT INTO notifications (id, user_id, type, issue_id, message) VALUES (?, ?, "validated", ?, ?)'
      ).bind(id('not'), issue.author_id, c.req.param('id'), 'Your issue has been validated by Student Council and forwarded to the department.')
    ]);
    return ok(c, { status: 'validated' });
  }
);

// POST /api/issues/:id/reject — SC rejects (submitted or under_council_review → rejected)
issueRoutes.post(
  '/:id/reject',
  requireAuth,
  zValidator('json', z.object({ reason: z.string().min(30) })),
  async (c) => {
    const user = c.get('user');
    if (!isCouncilOrAdmin(user.role)) return fail(c, 403, 'Only Student Council can reject issues');

    const issue = await c.env.DB.prepare('SELECT status, author_id, appeal_allowed FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ status: string; author_id: string; appeal_allowed: number }>();
    if (!issue) return fail(c, 404, 'Issue not found');
    if (!['submitted', 'under_council_review'].includes(issue.status)) {
      return fail(c, 400, 'Only submitted or under-review issues can be rejected');
    }

    const { reason } = c.req.valid('json');
    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE issues SET status = "rejected", council_note = ?, council_reviewer_id = ?, council_reviewed_at = datetime("now"), updated_at = datetime("now") WHERE id = ?'
      ).bind(reason, user.id, c.req.param('id')),
      c.env.DB.prepare(
        'INSERT INTO issue_history (id, issue_id, changed_by, field, old_value, new_value, note) VALUES (?, ?, ?, "status", ?, "rejected", ?)'
      ).bind(id('hist'), c.req.param('id'), user.id, issue.status, reason),
      c.env.DB.prepare(
        'INSERT INTO notifications (id, user_id, type, issue_id, message) VALUES (?, ?, "rejected", ?, ?)'
      ).bind(id('not'), issue.author_id, c.req.param('id'), `Your issue was rejected: ${reason.slice(0, 100)}. You may appeal once.`)
    ]);
    return ok(c, { status: 'rejected' });
  }
);

// POST /api/issues/:id/council-note — SC adds/updates council note
issueRoutes.post(
  '/:id/council-note',
  requireAuth,
  zValidator('json', z.object({ note: z.string().min(5) })),
  async (c) => {
    const user = c.get('user');
    if (!isCouncilOrAdmin(user.role)) return fail(c, 403, 'Only Student Council can add council notes');

    await c.env.DB.prepare(
      'UPDATE issues SET council_note = ?, council_reviewer_id = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(c.req.valid('json').note, user.id, c.req.param('id')).run();
    return ok(c, { updated: true });
  }
);

// POST /api/issues/:id/appeal — author appeals a rejected issue (once)
issueRoutes.post(
  '/:id/appeal',
  requireAuth,
  rateLimit('appeal', 5, 3600),
  zValidator('json', z.object({ reason: z.string().min(50) })),
  async (c) => {
    const user = c.get('user');
    const issue = await c.env.DB.prepare('SELECT status, author_id, appeal_allowed FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ status: string; author_id: string; appeal_allowed: number }>();
    if (!issue) return fail(c, 404, 'Issue not found');
    if (issue.author_id !== user.id) return fail(c, 403, 'You can only appeal your own issues');
    if (issue.status !== 'rejected') return fail(c, 400, 'Only rejected issues can be appealed');
    if (!issue.appeal_allowed) return fail(c, 400, 'You have already used your appeal for this issue');

    const existing = await c.env.DB.prepare('SELECT id FROM issue_appeals WHERE issue_id = ? AND author_id = ?').bind(c.req.param('id'), user.id).first();
    if (existing) return fail(c, 400, 'You have already submitted an appeal for this issue');

    const appealId = id('apl');
    await c.env.DB.batch([
      c.env.DB.prepare(
        'INSERT INTO issue_appeals (id, issue_id, author_id, reason) VALUES (?, ?, ?, ?)'
      ).bind(appealId, c.req.param('id'), user.id, c.req.valid('json').reason),
      c.env.DB.prepare(
        'UPDATE issues SET appeal_allowed = 0, status = "submitted", updated_at = datetime("now") WHERE id = ?'
      ).bind(c.req.param('id')),
      c.env.DB.prepare(
        'INSERT INTO issue_history (id, issue_id, changed_by, field, old_value, new_value, note) VALUES (?, ?, ?, "status", "rejected", "submitted", ?)'
      ).bind(id('hist'), c.req.param('id'), user.id, `Appeal submitted: ${c.req.valid('json').reason.slice(0, 100)}`)
    ]);
    return ok(c, { id: appealId }, { status: 201 });
  }
);

// POST /api/issues/:id/vote
issueRoutes.post(
  '/:id/vote',
  requireAuth,
  rateLimit('vote', 50, 3600),
  zValidator('json', z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) })),
  async (c) => {
    const { value } = c.req.valid('json');
    const user = c.get('user');
    const issueId = c.req.param('id');

    if (value === 0) {
      await c.env.DB.prepare('DELETE FROM votes WHERE user_id = ? AND issue_id = ?').bind(user.id, issueId).run();
    } else {
      await c.env.DB.prepare(
        'INSERT INTO votes (user_id, issue_id, value) VALUES (?, ?, ?) ON CONFLICT(user_id, issue_id) DO UPDATE SET value = excluded.value'
      ).bind(user.id, issueId, value).run();
    }
    await c.env.DB.prepare(
      'UPDATE issues SET upvotes = (SELECT COUNT(*) FROM votes WHERE issue_id = ? AND value = 1) - (SELECT COUNT(*) FROM votes WHERE issue_id = ? AND value = -1), updated_at = datetime("now") WHERE id = ?'
    ).bind(issueId, issueId, issueId).run();

    const row = await c.env.DB.prepare('SELECT upvotes FROM issues WHERE id = ?').bind(issueId).first();
    return ok(c, row);
  }
);

// POST /api/issues/:id/follow
issueRoutes.post('/:id/follow', requireAuth, async (c) => {
  const user = c.get('user');
  const existing = await c.env.DB.prepare('SELECT 1 FROM follows WHERE user_id = ? AND issue_id = ?').bind(user.id, c.req.param('id')).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM follows WHERE user_id = ? AND issue_id = ?').bind(user.id, c.req.param('id')).run();
    return ok(c, { following: false });
  }
  await c.env.DB.prepare('INSERT INTO follows (user_id, issue_id) VALUES (?, ?)').bind(user.id, c.req.param('id')).run();
  return ok(c, { following: true });
});

// GET /api/issues/:id/history
issueRoutes.get('/:id/history', requireAuth, async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM issue_history WHERE issue_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all();
  return ok(c, rows.results);
});

// POST /api/issues/:id/merge — student_council+: merge this issue into another
issueRoutes.post(
  '/:id/merge',
  requireAuth,
  zValidator('json', z.object({ merge_into: z.string().min(1), note: z.string().min(10) })),
  async (c) => {
    const user = c.get('user');
    if (!isCouncilOrAdmin(user.role)) return fail(c, 403, 'Only Student Council can merge issues');

    const { merge_into, note } = c.req.valid('json');
    const sourceId = c.req.param('id');
    if (sourceId === merge_into) return fail(c, 400, 'Cannot merge an issue into itself');

    const [source, target] = await Promise.all([
      c.env.DB.prepare('SELECT id, author_id, status FROM issues WHERE id = ?').bind(sourceId).first<{ id: string; author_id: string; status: string }>(),
      c.env.DB.prepare('SELECT id, title FROM issues WHERE id = ?').bind(merge_into).first<{ id: string; title: string }>()
    ]);
    if (!source) return fail(c, 404, 'Source issue not found');
    if (!target) return fail(c, 404, 'Target issue not found');
    if (['closed', 'rejected'].includes(source.status)) return fail(c, 400, 'Cannot merge a closed or rejected issue');

    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE issues SET status = "closed", is_duplicate_of = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(merge_into, sourceId),
      c.env.DB.prepare(
        'INSERT INTO issue_history (id, issue_id, changed_by, field, old_value, new_value, note) VALUES (?, ?, ?, "merged_into", ?, ?, ?)'
      ).bind(id('hist'), sourceId, user.id, sourceId, merge_into, note),
      c.env.DB.prepare(
        'INSERT INTO notifications (id, user_id, type, issue_id, message) VALUES (?, ?, "merged", ?, ?)'
      ).bind(id('not'), source.author_id, sourceId, `Your issue was merged into another issue: "${target.title}"`)
    ]);
    return ok(c, { merged_into: merge_into });
  }
);

// POST /api/issues/:id/duplicate — dept_admin+
issueRoutes.post(
  '/:id/duplicate',
  requireAuth,
  requireRole('dept_admin'),
  zValidator('json', z.object({ duplicate_of: z.string(), note: z.string().min(10) })),
  async (c) => {
    const { duplicate_of, note } = c.req.valid('json');
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE issues SET is_duplicate_of = ?, status = "closed", updated_at = datetime("now") WHERE id = ?').bind(duplicate_of, c.req.param('id')),
      c.env.DB.prepare('INSERT INTO issue_history (id, issue_id, changed_by, field, new_value, note) VALUES (?, ?, ?, "is_duplicate_of", ?, ?)').bind(id('hist'), c.req.param('id'), c.get('user').id, duplicate_of, note)
    ]);
    return ok(c, { duplicate_of });
  }
);

async function maybeUser(env: Env, authorization: string | null): Promise<User | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const { verifySession } = await import('../lib/auth');
  try {
    return await verifySession(env, authorization.slice('Bearer '.length));
  } catch {
    return null;
  }
}
