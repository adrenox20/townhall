import type { Context } from 'hono';
import type { Env, Variables } from '../env';
import { id } from '../utils/ids';
import { now } from '../utils/dates';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function notify(c: AppContext, userId: string, title: string, body: string, issueId?: string) {
  const notification = { id: id('notif'), userId, title, body, issueId };
  await c.env.DB.prepare('INSERT INTO notifications (id, user_id, type, title, body, issue_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(notification.id, userId, 'issue_update', title, body, issueId || null, now()).run();
  // Queue send is best-effort; DB insert above is the source of truth
  try { await c.env.NOTIFICATION_QUEUE.send(notification); } catch { /* queue may not be bound in dev */ }
}

/**
 * Fan-out a notification to every user who holds the moderator or portal_admin role.
 * Used when a new issue is created so reviewers can triage and set priority.
 */
export async function notifyModeratorsAndAdmins(
  c: AppContext,
  title: string,
  body: string,
  issueId?: string,
) {
  const rows = await c.env.DB.prepare(
    `SELECT DISTINCT ur.user_id
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE r.name IN ('moderator', 'portal_admin')`
  ).all<{ user_id: string }>();

  for (const row of rows.results) {
    await notify(c, row.user_id, title, body, issueId);
  }
}

