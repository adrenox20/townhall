import { getCookie } from 'hono/cookie';
import { jwtVerify } from 'jose';
import type { MiddlewareHandler } from 'hono';
import type { Env, Permission, Variables } from '../env';
import { getUserWithPermissions } from '../db/queries';
import { appError } from './errors';

async function verifyToken(secret: string, token: string) {
  if (!secret) throw appError('CONFIG_ERROR', 'JWT_SECRET is not configured', 500);
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key);
  return payload.sub;
}

export const requireAuth = (): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> => async (c, next) => {
  const auth = c.req.header('Authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  const token = bearer || getCookie(c, 'session');
  if (!token) throw appError('UNAUTHORIZED', 'Authentication required', 401);
  const userId = await verifyToken(c.env.JWT_SECRET, token);
  if (!userId) throw appError('UNAUTHORIZED', 'Invalid session', 401);
  const stored = await c.env.KV.get(`session:${token}`);
  if (!bearer && !stored) throw appError('UNAUTHORIZED', 'Session expired', 401);
  const user = await getUserWithPermissions(c.env.DB, userId);
  if (!user) throw appError('UNAUTHORIZED', 'User not found', 401);
  if (user.status === 'suspended') throw appError('FORBIDDEN', 'User is suspended', 403);
  c.set('user', user);
  await next();
};

export const requirePermission = (permission: Permission): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> => async (c, next) => {
  const user = c.get('user');
  if (!user.permissions.includes(permission)) throw appError('FORBIDDEN', 'Insufficient permissions', 403);
  await next();
};

export const requireAnyPermission = (permissions: Permission[]): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> => async (c, next) => {
  const user = c.get('user');
  if (!permissions.some((permission) => user.permissions.includes(permission))) throw appError('FORBIDDEN', 'Insufficient permissions', 403);
  await next();
};
