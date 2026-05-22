import type { Context } from 'hono';

export function ok(c: Context, data: unknown, meta: Record<string, unknown> = {}) {
  return c.json({ data, meta: { requestId: c.get('requestId'), ...meta } });
}

export function created(c: Context, data: unknown) {
  return c.json({ data, meta: { requestId: c.get('requestId') } }, 201);
}

export function fail(c: Context, code: string, message: string, status = 400, details: Record<string, unknown> = {}) {
  return c.json({ error: { code, message, details } }, status as never);
}
