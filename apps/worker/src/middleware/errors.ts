import type { MiddlewareHandler } from 'hono';
import { id } from '../utils/ids';

export const requestContext: MiddlewareHandler = async (c, next) => {
  c.set('requestId', id('req'));
  await next();
};

export function appError(code: string, message: string, status = 400) {
  const error = new Error(message) as Error & { code: string; status: number };
  error.code = code;
  error.status = status;
  return error;
}
