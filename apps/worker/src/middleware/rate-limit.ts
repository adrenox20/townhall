import type { MiddlewareHandler } from 'hono';
import type { Env } from '../env';
import { appError } from './errors';

export function rateLimit(action: string, limit: number, windowSeconds: number): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'local';
    const key = `rate:${action}:${ip}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    const value = Number(await c.env.KV.get(key) || '0');
    if (value >= limit) throw appError('RATE_LIMITED', 'Too many requests', 429);
    await c.env.KV.put(key, String(value + 1), { expirationTtl: windowSeconds });
    await next();
  };
}
