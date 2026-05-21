import type { Context } from 'hono';

export function ok<T>(c: Context, data: T, init?: ResponseInit) {
  return c.json({ data }, init ? ({ status: init.status ?? 200, headers: init.headers } as never) : 200);
}

export function fail(c: Context, status: number, message: string, details?: unknown) {
  return c.json({ error: { message, details } }, status as never);
}
