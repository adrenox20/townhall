import { createMiddleware } from 'hono/factory';
import type { AppVariables, Env } from '../types/env';
import { fail } from '../lib/response';

export function rateLimit(action: string, limit: number, windowSeconds: number) {
  return createMiddleware<{ Bindings: Env; Variables: AppVariables }>(async (c, next) => {
    const user = c.get('user');
    const fallback = user?.id ?? c.req.header('CF-Connecting-IP') ?? 'anonymous';
    const key = `ratelimit:${action}:${fallback}`;
    const current = Number((await c.env.KV.get(key)) ?? '0');

    if (current >= limit) return fail(c, 429, 'Rate limit exceeded');
    await c.env.KV.put(key, String(current + 1), { expirationTtl: windowSeconds });
    await next();
  });
}
