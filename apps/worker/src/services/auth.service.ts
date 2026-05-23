import { SignJWT } from 'jose';
import type { Context } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import type { Env, Variables } from '../env';
import { id } from '../utils/ids';
import { now } from '../utils/dates';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function signSession(c: AppContext, userId: string) {
  const ttl = Number(c.env.SESSION_TTL_SECONDS || 604800);
  if (!c.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured. Set it with: wrangler secret put JWT_SECRET');
  const key = new TextEncoder().encode(c.env.JWT_SECRET);
  const token = await new SignJWT({ typ: 'session' }).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime(`${ttl}s`).sign(key);
  await c.env.KV.put(`session:${token}`, userId, { expirationTtl: ttl });
  await c.env.DB.prepare('INSERT INTO auth_sessions (id, user_id, expires_at, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id('sess'), userId, new Date(Date.now() + ttl * 1000).toISOString(), c.req.header('CF-Connecting-IP') || null, c.req.header('User-Agent') || null, now()).run();
  const secure = (c.env.FRONTEND_URL || '').startsWith('https://');
  setCookie(c, 'session', token, { httpOnly: true, secure, sameSite: 'Lax', path: '/', maxAge: ttl });
  return token;
}

export async function clearSession(c: AppContext) {
  const token = getCookie(c, 'session');
  if (token) {
    // Revoke the KV entry so the token cannot be replayed until TTL expiry
    await c.env.KV.delete(`session:${token}`);
  }
  deleteCookie(c, 'session', { path: '/' });
}

/** Comma-separated domains in env; also matches subdomains (e.g. user@dept.rishihood.edu.in). */
export function parseAllowedEmailDomains(domainsConfig: string): string[] {
  return domainsConfig
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function assertAllowedEmail(email: string, domainsConfig: string): boolean {
  const host = email.split('@')[1]?.toLowerCase();
  if (!host) return false;
  const domains = parseAllowedEmailDomains(domainsConfig);
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** @deprecated Use assertAllowedEmail with ALLOWED_EMAIL_DOMAINS */
export function assertAllowedDomain(email: string, domain: string) {
  return assertAllowedEmail(email, domain);
}

export function getAllowedEmailDomainsFromEnv(env: {
  ALLOWED_EMAIL_DOMAINS?: string;
  ALLOWED_EMAIL_DOMAIN: string;
}): string {
  return env.ALLOWED_EMAIL_DOMAINS || env.ALLOWED_EMAIL_DOMAIN;
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
