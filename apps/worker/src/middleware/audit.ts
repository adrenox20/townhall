import type { Context } from 'hono';
import type { Env, Variables } from '../env';
import { id } from '../utils/ids';
import { now } from '../utils/dates';

export async function audit(c: Context<{ Bindings: Env; Variables: Variables }>, action: string, entityType: string, entityId?: string, details: Record<string, unknown> = {}) {
  const user = c.get('user');
  await c.env.DB.prepare(
    'INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, ip, user_agent, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id('audit'),
    user?.id || null,
    action,
    entityType,
    entityId || null,
    c.req.header('CF-Connecting-IP') || null,
    c.req.header('User-Agent') || null,
    JSON.stringify(details),
    now()
  ).run();
}
