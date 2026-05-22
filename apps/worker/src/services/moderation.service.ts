import type { Context } from 'hono';
import type { Env, Variables } from '../env';
import { id } from '../utils/ids';
import { now } from '../utils/dates';

export async function reportContent(c: Context<{ Bindings: Env; Variables: Variables }>, entityType: string, entityId: string, reason: string) {
  const user = c.get('user');
  await c.env.DB.prepare('INSERT INTO moderation_queue (id, entity_type, entity_id, reporter_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id('mod'), entityType, entityId, user?.id || null, reason, now()).run();
}
