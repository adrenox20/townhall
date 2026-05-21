import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppVariables, Env, User } from '../types/env';
import { id } from '../lib/ids';
import { fail, ok } from '../lib/response';
import { isAdmin, requireAuth, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const statuses = ['submitted', 'under_review', 'accepted', 'in_progress', 'resolved', 'closed', 'wont_fix'] as const;
const priorities = ['low', 'medium', 'high', 'critical'] as const;
const transitions: Record<string, string[]> = {
  submitted: ['under_review', 'accepted', 'closed', 'wont_fix'],
  under_review: ['accepted', 'submitted', 'closed', 'wont_fix'],
  accepted: ['in_progress', 'under_review', 'closed', 'wont_fix'],
  in_progress: ['resolved', 'accepted', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: ['in_progress'],
  wont_fix: ['under_review']
};

export const issueRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

function issueSelect(admin: boolean) {
  const authorName = admin
    ? 'users.name'
    : "CASE WHEN issues.is_anonymous = 1 THEN 'Anonymous Student' ELSE users.name END";
  const authorAvatar = admin ? 'users.avatar_url' : 'CASE WHEN issues.is_anonymous = 1 THEN NULL ELSE users.avatar_url END';
  return `issues.*, categories.name AS category_name, categories.color AS category_color, ${authorName} AS author_name, ${authorAvatar} AS author_avatar`;
}

issueRoutes.get('/', async (c) => {
  const user = await maybeUser(c.env, c.req.header('Authorization') ?? null);
  const clauses: string[] = ['1=1'];
  const binds: unknown[] = [];
  const status = c.req.query('status');
  const category = c.req.query('category');
  const search = c.req.query('search');
  const sort = c.req.query('sort') ?? 'new';
  const page = Math.max(Number(c.req.query('page') ?? '1'), 1);
  const limit = Math.min(Number(c.req.query('limit') ?? '20'), 50);

  if (status) {
    clauses.push(`issues.status IN (${status.split(',').map(() => '?').join(',')})`);
    binds.push(...status.split(','));
  }
  if (category) {
    clauses.push('issues.category_id = ?');
    binds.push(category);
  }
  if (search) {
    clauses.push('issues.rowid IN (SELECT rowid FROM issues_fts WHERE issues_fts MATCH ?)');
    binds.push(search.replace(/"/g, ''));
  }

  const orderBy = sort === 'top' ? 'issues.upvotes DESC' : sort === 'trending' ? 'issues.trending_score DESC, issues.upvotes DESC' : 'issues.created_at DESC';
  const rows = await c.env.DB.prepare(
    `SELECT ${issueSelect(Boolean(user && isAdmin(user.role)))},
      (SELECT COUNT(*) FROM comments WHERE comments.issue_id = issues.id AND comments.is_deleted = 0) AS comment_count
     FROM issues
     LEFT JOIN categories ON categories.id = issues.category_id
     LEFT JOIN users ON users.id = issues.author_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY issues.is_pinned DESC, ${orderBy}
     LIMIT ? OFFSET ?`
  )
    .bind(...binds, limit, (page - 1) * limit)
    .all();

  return ok(c, { items: rows.results, page, limit });
});

issueRoutes.post(
  '/',
  requireAuth,
  rateLimit('issue-create', 5, 3600),
  zValidator(
    'json',
    z.object({
      title: z.string().min(10),
      description: z.string().min(20),
      category_id: z.string().optional(),
      priority: z.enum(priorities).default('medium'),
      department: z.string().optional(),
      is_anonymous: z.boolean().default(false),
      tag_ids: z.array(z.string()).default([]),
      attachment_keys: z.array(z.string()).default([])
    })
  ),
  async (c) => {
    const input = c.req.valid('json');
    const user = c.get('user');
    const issueId = id('iss');

    await c.env.DB.batch([
      c.env.DB.prepare(
        'INSERT INTO issues (id, title, description, category_id, author_id, priority, department, is_anonymous, attachment_keys) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(issueId, input.title, input.description, input.category_id ?? null, user.id, input.priority, input.department ?? null, input.is_anonymous ? 1 : 0, JSON.stringify(input.attachment_keys)),
      ...input.tag_ids.map((tagId) => c.env.DB.prepare('INSERT OR IGNORE INTO issue_tags (issue_id, tag_id) VALUES (?, ?)').bind(issueId, tagId)),
      c.env.DB.prepare('INSERT INTO issue_history (id, issue_id, changed_by, field, new_value, note) VALUES (?, ?, ?, "status", "submitted", ?)').bind(id('hist'), issueId, user.id, 'Issue submitted')
    ]);

    return ok(c, { id: issueId }, { status: 201 });
  }
);

issueRoutes.get('/:id', async (c) => {
  const user = await maybeUser(c.env, c.req.header('Authorization') ?? null);
  const admin = Boolean(user && isAdmin(user.role));
  const issue = await c.env.DB.prepare(
    `SELECT ${issueSelect(admin)} FROM issues LEFT JOIN categories ON categories.id = issues.category_id LEFT JOIN users ON users.id = issues.author_id WHERE issues.id = ?`
  )
    .bind(c.req.param('id'))
    .first();
  if (!issue) return fail(c, 404, 'Issue not found');

  await c.env.DB.prepare('UPDATE issues SET view_count = view_count + 1 WHERE id = ?').bind(c.req.param('id')).run();
  const comments = await c.env.DB.prepare(
    `SELECT comments.*, users.name AS author_name, users.avatar_url AS author_avatar
     FROM comments LEFT JOIN users ON users.id = comments.author_id
     WHERE comments.issue_id = ? AND comments.is_deleted = 0 ${admin ? '' : 'AND comments.is_internal_note = 0'}
     ORDER BY comments.is_pinned DESC, comments.created_at ASC`
  )
    .bind(c.req.param('id'))
    .all();
  const history = await c.env.DB.prepare(
    'SELECT issue_history.*, users.name AS changed_by_name FROM issue_history LEFT JOIN users ON users.id = issue_history.changed_by WHERE issue_id = ? ORDER BY created_at DESC'
  )
    .bind(c.req.param('id'))
    .all();
  const tags = await c.env.DB.prepare('SELECT tags.* FROM tags JOIN issue_tags ON tags.id = issue_tags.tag_id WHERE issue_tags.issue_id = ?').bind(c.req.param('id')).all();

  return ok(c, { issue, comments: comments.results, history: history.results, tags: tags.results });
});

issueRoutes.patch('/:id', requireAuth, zValidator('json', z.object({ title: z.string().min(10).optional(), description: z.string().min(20).optional(), priority: z.enum(priorities).optional(), category_id: z.string().nullable().optional() })), async (c) => {
  const user = c.get('user');
  const issue = await c.env.DB.prepare('SELECT * FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ author_id: string; created_at: string }>();
  if (!issue) return fail(c, 404, 'Issue not found');
  const canEditOwn = issue.author_id === user.id && Date.now() - new Date(issue.created_at).getTime() < 30 * 60 * 1000;
  if (!canEditOwn && !isAdmin(user.role)) return fail(c, 403, 'You can only edit your own issue within 30 minutes');

  const input = c.req.valid('json');
  await c.env.DB.prepare('UPDATE issues SET title = COALESCE(?, title), description = COALESCE(?, description), priority = COALESCE(?, priority), category_id = COALESCE(?, category_id), updated_at = datetime("now") WHERE id = ?')
    .bind(input.title ?? null, input.description ?? null, input.priority ?? null, input.category_id ?? null, c.req.param('id'))
    .run();
  return ok(c, { updated: true });
});

issueRoutes.delete('/:id', requireAuth, requireRole('moderator'), async (c) => {
  await c.env.DB.prepare('UPDATE issues SET status = "closed", updated_at = datetime("now") WHERE id = ?').bind(c.req.param('id')).run();
  return ok(c, { closed: true });
});

issueRoutes.post('/:id/vote', requireAuth, rateLimit('vote', 50, 3600), zValidator('json', z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) })), async (c) => {
  const { value } = c.req.valid('json');
  const user = c.get('user');
  const issueId = c.req.param('id');
  if (value === 0) {
    await c.env.DB.prepare('DELETE FROM votes WHERE user_id = ? AND issue_id = ?').bind(user.id, issueId).run();
  } else {
    await c.env.DB.prepare('INSERT INTO votes (user_id, issue_id, value) VALUES (?, ?, ?) ON CONFLICT(user_id, issue_id) DO UPDATE SET value = excluded.value').bind(user.id, issueId, value).run();
  }
  await c.env.DB.prepare(
    'UPDATE issues SET upvotes = (SELECT COUNT(*) FROM votes WHERE issue_id = ? AND value = 1) - (SELECT COUNT(*) FROM votes WHERE issue_id = ? AND value = -1), updated_at = datetime("now") WHERE id = ?'
  )
    .bind(issueId, issueId, issueId)
    .run();
  const row = await c.env.DB.prepare('SELECT upvotes FROM issues WHERE id = ?').bind(issueId).first();
  return ok(c, row);
});

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

issueRoutes.get('/:id/history', requireAuth, async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM issue_history WHERE issue_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all();
  return ok(c, rows.results);
});

issueRoutes.patch('/:id/status', requireAuth, requireRole('moderator'), zValidator('json', z.object({ status: z.enum(statuses), note: z.string().min(10) })), async (c) => {
  const { status, note } = c.req.valid('json');
  const issue = await c.env.DB.prepare('SELECT status, author_id FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ status: string; author_id: string }>();
  if (!issue) return fail(c, 404, 'Issue not found');
  if (!transitions[issue.status]?.includes(status)) return fail(c, 400, `Illegal transition from ${issue.status} to ${status}`);

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE issues SET status = ?, updated_at = datetime("now"), resolved_at = CASE WHEN ? = "resolved" THEN datetime("now") ELSE resolved_at END WHERE id = ?').bind(status, status, c.req.param('id')),
    c.env.DB.prepare('INSERT INTO issue_history (id, issue_id, changed_by, field, old_value, new_value, note) VALUES (?, ?, ?, "status", ?, ?, ?)').bind(id('hist'), c.req.param('id'), c.get('user').id, issue.status, status, note),
    c.env.DB.prepare('INSERT INTO notifications (id, user_id, type, issue_id, message) VALUES (?, ?, "status_change", ?, ?)').bind(id('not'), issue.author_id, c.req.param('id'), `Your issue moved to ${status.replaceAll('_', ' ')}`)
  ]);
  return ok(c, { status });
});

issueRoutes.post('/:id/duplicate', requireAuth, requireRole('moderator'), zValidator('json', z.object({ duplicate_of: z.string(), note: z.string().min(10) })), async (c) => {
  const { duplicate_of, note } = c.req.valid('json');
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE issues SET is_duplicate_of = ?, status = "closed", updated_at = datetime("now") WHERE id = ?').bind(duplicate_of, c.req.param('id')),
    c.env.DB.prepare('INSERT INTO issue_history (id, issue_id, changed_by, field, new_value, note) VALUES (?, ?, ?, "is_duplicate_of", ?, ?)').bind(id('hist'), c.req.param('id'), c.get('user').id, duplicate_of, note)
  ]);
  return ok(c, { duplicate_of });
});

async function maybeUser(env: Env, authorization: string | null): Promise<User | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const { verifySession } = await import('../lib/auth');
  try {
    return await verifySession(env, authorization.slice('Bearer '.length));
  } catch {
    return null;
  }
}
