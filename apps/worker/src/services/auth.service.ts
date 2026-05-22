import { SignJWT } from 'jose';
import type { Context } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import type { Env, Variables } from '../env';
import { id } from '../utils/ids';
import { now } from '../utils/dates';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function signSession(c: AppContext, userId: string) {
  const ttl = Number(c.env.SESSION_TTL_SECONDS || 604800);
  const key = new TextEncoder().encode(c.env.JWT_SECRET || 'dev-secret-change-me');
  const token = await new SignJWT({ typ: 'session' }).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime(`${ttl}s`).sign(key);
  await c.env.KV.put(`session:${token}`, userId, { expirationTtl: ttl });
  await c.env.DB.prepare('INSERT INTO auth_sessions (id, user_id, expires_at, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id('sess'), userId, new Date(Date.now() + ttl * 1000).toISOString(), c.req.header('CF-Connecting-IP') || null, c.req.header('User-Agent') || null, now()).run();
  setCookie(c, 'session', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: ttl });
  return token;
}

export function clearSession(c: AppContext) {
  deleteCookie(c, 'session', { path: '/' });
}

export function assertAllowedDomain(email: string, domain: string) {
  return email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
}

export async function upsertUser(c: AppContext, email: string, name?: string) {
  const current = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
  const userId = current?.id || id('user');
  if (current) {
    await c.env.DB.prepare('UPDATE users SET name = COALESCE(?, name), last_login_at = ?, updated_at = ? WHERE id = ?').bind(name || null, now(), now(), userId).run();
  } else {
    await c.env.DB.prepare('INSERT INTO users (id, email, name, last_login_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, email, name || email.split('@')[0], now(), now(), now()).run();
    const role = email === c.env.INITIAL_PORTAL_ADMIN_EMAIL ? 'role_portal_admin' : 'role_student';
    await c.env.DB.prepare('INSERT INTO user_roles (user_id, role_id, department_id) VALUES (?, ?, NULL)').bind(userId, role).run();
  }
  return userId;
}
