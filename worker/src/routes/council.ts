import { Hono } from 'hono';
import type { AppVariables, Env } from '../types/env';
import { ok } from '../lib/response';
import { requireAuth, requireRole } from '../middleware/auth';

export const councilRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

councilRoutes.use('*', requireAuth, requireRole('student_council'));

// GET /api/council/queue — submitted + under_council_review issues
councilRoutes.get('/queue', async (c) => {
  const slaHours = Number(c.env.COUNCIL_REVIEW_SLA_HOURS ?? '48');
  const rows = await c.env.DB.prepare(
    `SELECT issues.*,
       categories.name AS category_name, categories.color AS category_color,
       users.name AS author_name,
       CASE WHEN julianday('now') - julianday(issues.created_at) > ? / 24.0 THEN 1 ELSE 0 END AS is_overdue
     FROM issues
     LEFT JOIN categories ON categories.id = issues.category_id
     LEFT JOIN users ON users.id = issues.author_id
     WHERE issues.status IN ('submitted','under_council_review')
     ORDER BY is_overdue DESC, issues.upvotes DESC, issues.created_at ASC`
  ).bind(slaHours).all();
  return ok(c, rows.results);
});

// GET /api/council/stats — KPIs for council dashboard
councilRoutes.get('/stats', async (c) => {
  const slaHours = Number(c.env.COUNCIL_REVIEW_SLA_HOURS ?? '48');
  const [queue, validated, rejected, avgReview, overdue, trending] = await Promise.all([
    c.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM issues WHERE status IN ('submitted','under_council_review')"
    ).first<{ count: number }>(),
    c.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM issues WHERE status = 'validated' AND council_reviewed_at >= datetime('now', '-7 days')"
    ).first<{ count: number }>(),
    c.env.DB.prepare(
      "SELECT COUNT(*) AS count FROM issues WHERE status = 'rejected'"
    ).first<{ count: number }>(),
    c.env.DB.prepare(
      `SELECT AVG((julianday(council_reviewed_at) - julianday(created_at)) * 24) AS hours
       FROM issues WHERE council_reviewed_at IS NOT NULL AND created_at >= datetime('now', '-30 days')`
    ).first<{ hours: number | null }>(),
    c.env.DB.prepare(
      `SELECT COUNT(*) AS count FROM issues
       WHERE status IN ('submitted','under_council_review')
       AND julianday('now') - julianday(created_at) > ? / 24.0`
    ).bind(slaHours).first<{ count: number }>(),
    c.env.DB.prepare(
      `SELECT date(created_at) AS day, COUNT(*) AS count FROM issues
       WHERE created_at >= datetime('now', '-14 days')
       GROUP BY day ORDER BY day`
    ).all()
  ]);

  const totalClosed = (validated?.count ?? 0) + (rejected?.count ?? 0);
  const rejectionRate = totalClosed > 0
    ? Math.round(((rejected?.count ?? 0) / totalClosed) * 100)
    : 0;

  return ok(c, {
    pending: queue?.count ?? 0,
    overdue: overdue?.count ?? 0,
    validatedThisWeek: validated?.count ?? 0,
    avgReviewHours: Number((avgReview?.hours ?? 0).toFixed(1)),
    rejectionRate,
    submissionTrend: trending.results
  });
});

// GET /api/council/analytics — submission trends, category breakdown
councilRoutes.get('/analytics', async (c) => {
  const [byStatus, byCategory, volume, topContributors, avgByDept] = await Promise.all([
    c.env.DB.prepare(
      'SELECT status, COUNT(*) AS count FROM issues GROUP BY status ORDER BY count DESC'
    ).all(),
    c.env.DB.prepare(
      'SELECT categories.name, categories.color, COUNT(issues.id) AS count FROM categories LEFT JOIN issues ON issues.category_id = categories.id GROUP BY categories.id ORDER BY count DESC'
    ).all(),
    c.env.DB.prepare(
      "SELECT date(created_at) AS day, COUNT(*) AS count FROM issues WHERE created_at >= datetime('now', '-30 days') GROUP BY day ORDER BY day"
    ).all(),
    c.env.DB.prepare(
      'SELECT users.name, users.email, COUNT(issues.id) AS issue_count FROM users JOIN issues ON issues.author_id = users.id GROUP BY users.id ORDER BY issue_count DESC LIMIT 10'
    ).all(),
    c.env.DB.prepare(
      `SELECT department,
         COUNT(*) AS total,
         AVG(CASE WHEN resolved_at IS NOT NULL THEN julianday(resolved_at) - julianday(created_at) END) AS avg_days
       FROM issues WHERE department IS NOT NULL GROUP BY department ORDER BY total DESC`
    ).all()
  ]);

  return ok(c, {
    byStatus: byStatus.results,
    byCategory: byCategory.results,
    volume: volume.results,
    topContributors: topContributors.results,
    avgByDept: avgByDept.results
  });
});
