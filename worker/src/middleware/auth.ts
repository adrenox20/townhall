import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import type { AppVariables, Env, Role } from '../types/env';
import { fail } from '../lib/response';
import { getBearerToken, verifySession } from '../lib/auth';

export const rank: Record<Role, number> = {
  student: 1,
  student_council: 2,
  dept_admin: 3,
  super_admin: 4
};

export const requireAuth = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(async (c, next) => {
  const token = getBearerToken(c.req.header('Authorization') ?? null) ?? getCookie(c, 'session');
  if (!token) return fail(c, 401, 'Authentication required');

  const user = await verifySession(c.env, token);
  if (!user) return fail(c, 401, 'Invalid or expired session');

  c.set('user', user);
  c.set('token', token);
  await next();
});

export function requireRole(role: Role) {
  return createMiddleware<{ Bindings: Env; Variables: AppVariables }>(async (c, next) => {
    const user = c.get('user');
    if (!user || rank[user.role] < rank[role]) return fail(c, 403, 'Insufficient permissions');
    await next();
  });
}

/** dept_admin and above — can change issue status, delete comments, assign */
export function isAdmin(role: Role) {
  return rank[role] >= rank.dept_admin;
}

/** student_council and above — can validate, add council notes, mark solutions */
export function isCouncilOrAdmin(role: Role) {
  return rank[role] >= rank.student_council;
}
