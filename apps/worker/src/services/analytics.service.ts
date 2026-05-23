import type { Context } from 'hono';
import type { Env, Variables } from '../env';

export async function issueMetrics(c: Context<{ Bindings: Env; Variables: Variables }>) {
  const totals = await c.env.DB.prepare('SELECT COUNT(*) total, SUM(status = "resolved") resolved, SUM(status = "escalated") escalated FROM issues WHERE is_deleted = 0 AND master_issue_id IS NULL').first();
  const byStatus = await c.env.DB.prepare('SELECT status, COUNT(*) count FROM issues WHERE is_deleted = 0 AND master_issue_id IS NULL GROUP BY status').all();
  const byCategory = await c.env.DB.prepare('SELECT c.name, COUNT(*) count FROM issues i LEFT JOIN categories c ON c.id = i.category_id WHERE i.is_deleted = 0 AND i.master_issue_id IS NULL GROUP BY c.name').all();
  return { totals, byStatus: byStatus.results, byCategory: byCategory.results };
}
