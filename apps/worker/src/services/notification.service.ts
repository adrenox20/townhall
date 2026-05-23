import type { Context } from 'hono';
import { id } from '../utils/ids';
import { now } from '../utils/dates';

export async function notify(c: Context, userId: string, title: string, body: string, issueId?: string) {
  const notification = { id: id('notif'), userId, title, body, issueId };
  await c.env.DB.prepare('INSERT INTO notifications (id, user_id, type, title, body, issue_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(notification.id, userId, 'issue_update', title, body, issueId || null, now()).run();
  // Queue send is best-effort; DB insert above is the source of truth
  try { await c.env.NOTIFICATION_QUEUE.send(notification); } catch { /* queue may not be bound in dev */ }
}
