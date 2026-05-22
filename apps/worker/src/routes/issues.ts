import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { requireAuth, requirePermission } from '../middleware/auth';
import { audit } from '../middleware/audit';
import { canTransition } from '../services/workflow.service';
import { findSimilarIssues } from '../services/duplicate.service';
import { addHours, now } from '../utils/dates';
import { id, publicIssueId } from '../utils/ids';
import { created, fail, ok } from '../utils/response';
import { normalizeText, summary } from '../utils/text';

export const issueRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
const writeIssue = z.object({ title: z.string().min(5), description: z.string().min(10), categoryId: z.string().optional(), departmentId: z.string().optional(), urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'), isAnonymous: z.boolean().default(false), tags: z.array(z.string()).default([]) });

issueRoutes.use('*', requireAuth());

issueRoutes.get('/', async (c) => {
  const q = `%${c.req.query('q') || ''}%`;
  const status = c.req.query('status');
  const rows = await c.env.DB.prepare(
    `SELECT i.*, c.name category, d.name department,
      (SELECT COUNT(*) FROM issue_votes v WHERE v.issue_id = i.id) votes,
      (SELECT COUNT(*) FROM comments cm WHERE cm.issue_id = i.id AND cm.is_deleted = 0) comments
     FROM issues i
     LEFT JOIN categories c ON c.id = i.category_id
     LEFT JOIN departments d ON d.id = i.department_id
     WHERE i.is_deleted = 0 AND (? IS NULL OR i.status = ?) AND (i.title LIKE ? OR i.description LIKE ?)
     ORDER BY i.created_at DESC LIMIT 50`
  ).bind(status || null, status || null, q, q).all();
  return ok(c, rows.results);
});

issueRoutes.post('/', requirePermission('issue:create'), zValidator('json', writeIssue), async (c) => {
  const body = c.req.valid('json');
  const user = c.get('user');
  const issueId = id('issue');
  const category = body.categoryId ? await c.env.DB.prepare('SELECT sla_hours FROM categories WHERE id = ?').bind(body.categoryId).first<{ sla_hours: number }>() : null;
  await c.env.DB.prepare(
    `INSERT INTO issues (id, public_id, title, normalized_title, description, summary, category_id, department_id, author_id, status, urgency, is_anonymous, sla_due_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?, ?, ?, ?)`
  ).bind(issueId, publicIssueId(), body.title, normalizeText(body.title), body.description, summary(body.description), body.categoryId || null, body.departmentId || null, user.id, body.urgency, body.isAnonymous ? 1 : 0, addHours(category?.sla_hours || 72), now(), now()).run();
  for (const tagId of body.tags) await c.env.DB.prepare('INSERT OR IGNORE INTO issue_tags (issue_id, tag_id) VALUES (?, ?)').bind(issueId, tagId).run();
  await c.env.DB.prepare('INSERT INTO issue_watchers (issue_id, user_id, created_at) VALUES (?, ?, ?)').bind(issueId, user.id, now()).run();
  const similar = await findSimilarIssues(c, body);
  for (const candidate of similar) await c.env.DB.prepare('INSERT OR IGNORE INTO related_issues (id, issue_id, related_issue_id, relation_type, score, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id('rel'), issueId, candidate.id, candidate.recommendation, candidate.score, now()).run();
  await c.env.DB.prepare('INSERT INTO activity_events (id, issue_id, actor_id, type, summary, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id('act'), issueId, user.id, 'issue_created', 'Issue submitted for review', now()).run();
  return created(c, { id: issueId, similar });
});

issueRoutes.post('/similar', zValidator('json', writeIssue.partial({ urgency: true, isAnonymous: true, tags: true })), async (c) => ok(c, await findSimilarIssues(c, c.req.valid('json'))));

issueRoutes.get('/:id', async (c) => {
  const issue = await c.env.DB.prepare('SELECT * FROM issues WHERE id = ? AND is_deleted = 0').bind(c.req.param('id')).first();
  if (!issue) return fail(c, 'NOT_FOUND', 'Issue not found', 404);
  return ok(c, issue);
});

issueRoutes.patch('/:id', zValidator('json', writeIssue.partial()), async (c) => {
  const issue = await c.env.DB.prepare('SELECT author_id, status FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ author_id: string; status: string }>();
  if (!issue) return fail(c, 'NOT_FOUND', 'Issue not found', 404);
  const user = c.get('user');
  if (issue.author_id !== user.id && !user.permissions.includes('issue:update_any')) return fail(c, 'FORBIDDEN', 'Cannot update this issue', 403);
  if (issue.author_id === user.id && issue.status !== 'pending_review') return fail(c, 'FORBIDDEN', 'Students can only edit pending review issues', 403);
  const body = c.req.valid('json');
  await c.env.DB.prepare('UPDATE issues SET title = COALESCE(?, title), normalized_title = COALESCE(?, normalized_title), description = COALESCE(?, description), category_id = COALESCE(?, category_id), department_id = COALESCE(?, department_id), urgency = COALESCE(?, urgency), updated_at = ? WHERE id = ?')
    .bind(body.title || null, body.title ? normalizeText(body.title) : null, body.description || null, body.categoryId || null, body.departmentId || null, body.urgency || null, now(), c.req.param('id')).run();
  return ok(c, { updated: true });
});

issueRoutes.delete('/:id', async (c) => {
  const issue = await c.env.DB.prepare('SELECT author_id, status FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ author_id: string; status: string }>();
  if (!issue || issue.author_id !== c.get('user').id || issue.status !== 'pending_review') return fail(c, 'FORBIDDEN', 'Can only delete own issue before review', 403);
  await c.env.DB.prepare('UPDATE issues SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?').bind(now(), now(), c.req.param('id')).run();
  return ok(c, { deleted: true });
});

issueRoutes.patch('/:id/status', requirePermission('issue:status_update'), zValidator('json', z.object({ status: z.string(), note: z.string().optional() })), async (c) => {
  const body = c.req.valid('json');
  const issue = await c.env.DB.prepare('SELECT status, author_id FROM issues WHERE id = ?').bind(c.req.param('id')).first<{ status: string; author_id: string }>();
  if (!issue) return fail(c, 'NOT_FOUND', 'Issue not found', 404);
  if (!canTransition(issue.status, body.status)) return fail(c, 'INVALID_TRANSITION', 'Invalid workflow transition', 409);
  await c.env.DB.prepare('UPDATE issues SET status = ?, first_response_at = COALESCE(first_response_at, ?), resolved_at = CASE WHEN ? = "resolved" THEN ? ELSE resolved_at END, updated_at = ? WHERE id = ?')
    .bind(body.status, now(), body.status, now(), now(), c.req.param('id')).run();
  await c.env.DB.prepare('INSERT INTO issue_workflow_events (id, issue_id, actor_id, from_status, to_status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id('flow'), c.req.param('id'), c.get('user').id, issue.status, body.status, body.note || null, now()).run();
  await audit(c, 'issue.status_update', 'issue', c.req.param('id'), { from: issue.status, to: body.status });
  return ok(c, { status: body.status });
});

issueRoutes.patch('/:id/assign', requirePermission('issue:assign'), zValidator('json', z.object({ assigneeId: z.string() })), async (c) => {
  const { assigneeId } = c.req.valid('json');
  await c.env.DB.prepare('UPDATE issues SET assignee_id = ?, updated_at = ? WHERE id = ?').bind(assigneeId, now(), c.req.param('id')).run();
  await c.env.DB.prepare('INSERT INTO issue_assignments (id, issue_id, assignee_id, actor_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(id('asg'), c.req.param('id'), assigneeId, c.get('user').id, now()).run();
  await audit(c, 'issue.assign', 'issue', c.req.param('id'), { assigneeId });
  return ok(c, { assigned: true });
});

issueRoutes.post('/:id/vote', async (c) => {
  await c.env.DB.prepare('INSERT OR REPLACE INTO issue_votes (issue_id, user_id, value, created_at) VALUES (?, ?, 1, ?)').bind(c.req.param('id'), c.get('user').id, now()).run();
  return ok(c, { voted: true });
});

issueRoutes.post('/:id/follow', async (c) => {
  await c.env.DB.prepare('INSERT OR IGNORE INTO issue_watchers (issue_id, user_id, created_at) VALUES (?, ?, ?)').bind(c.req.param('id'), c.get('user').id, now()).run();
  return ok(c, { following: true });
});

issueRoutes.delete('/:id/follow', async (c) => {
  await c.env.DB.prepare('DELETE FROM issue_watchers WHERE issue_id = ? AND user_id = ?').bind(c.req.param('id'), c.get('user').id).run();
  return ok(c, { following: false });
});

issueRoutes.get('/:id/timeline', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM activity_events WHERE issue_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all();
  return ok(c, rows.results);
});

issueRoutes.post('/:id/merge', requirePermission('issue:merge'), zValidator('json', z.object({ mergedIssueId: z.string(), reason: z.string().optional(), score: z.number().optional() })), async (c) => {
  const body = c.req.valid('json');
  await c.env.DB.prepare('UPDATE issues SET master_issue_id = ?, duplicate_score = ?, updated_at = ? WHERE id = ?').bind(c.req.param('id'), body.score || null, now(), body.mergedIssueId).run();
  await c.env.DB.prepare('INSERT INTO merge_relations (id, master_issue_id, merged_issue_id, actor_id, reason, score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id('merge'), c.req.param('id'), body.mergedIssueId, c.get('user').id, body.reason || null, body.score || null, now()).run();
  await audit(c, 'issue.merge', 'issue', c.req.param('id'), body);
  return ok(c, { merged: true });
});

issueRoutes.post('/:id/link-related', requirePermission('issue:merge'), zValidator('json', z.object({ relatedIssueId: z.string(), score: z.number().default(0.55) })), async (c) => {
  const body = c.req.valid('json');
  await c.env.DB.prepare('INSERT OR IGNORE INTO related_issues (id, issue_id, related_issue_id, relation_type, score, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id('rel'), c.req.param('id'), body.relatedIssueId, 'related', body.score, now()).run();
  return ok(c, { linked: true });
});

issueRoutes.delete('/:id/related/:relatedId', requirePermission('issue:merge'), async (c) => {
  await c.env.DB.prepare('DELETE FROM related_issues WHERE issue_id = ? AND related_issue_id = ?').bind(c.req.param('id'), c.req.param('relatedId')).run();
  return ok(c, { unlinked: true });
});

issueRoutes.post('/:id/archive', requirePermission('issue:archive'), async (c) => {
  await c.env.DB.prepare('UPDATE issues SET status = "archived", is_archived = 1, updated_at = ? WHERE id = ?').bind(now(), c.req.param('id')).run();
  await audit(c, 'issue.archive', 'issue', c.req.param('id'));
  return ok(c, { archived: true });
});
