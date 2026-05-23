import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../env';
import { appError } from './errors';

type KeyFn = (c: Context<{ Bindings: Env }>) => string | Promise<string>;

export function rateLimit(
  action: string,
  limit: number,
  windowSeconds: number,
  getKey: KeyFn = (c) => c.req.header('CF-Connecting-IP') || 'local',
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const key = `rate:${action}:${await getKey(c)}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    const value = Number(await c.env.KV.get(key) || '0');
    if (value >= limit) throw appError('RATE_LIMITED', 'Too many requests', 429);
    await c.env.KV.put(key, String(value + 1), { expirationTtl: windowSeconds });
    await next();
  };
}

// Key by a JSON body field — clones the raw request so the stream isn't consumed for zValidator
export function byBodyField(field: string): KeyFn {
  return async (c) => {
    try {
      const body = await c.req.raw.clone().json() as Record<string, unknown>;
      return String(body?.[field] ?? 'unknown').toLowerCase();
    } catch {
      return 'unknown';
    }
  };
}
