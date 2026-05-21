import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';
import type { AppVariables, Env, User } from '../types/env';
import { displayNameFromEmail, isAllowedEmail, signSession } from '../lib/auth';
import { sendEmail } from '../lib/email';
import { id } from '../lib/ids';
import { fail, ok } from '../lib/response';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

export const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();
const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

async function upsertVerifiedUser(env: Env, email: string, name?: string, avatarUrl?: string | null) {
  const normalizedEmail = email.toLowerCase();
  const existing = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).first<User>();
  const role = normalizedEmail === env.INITIAL_ADMIN_EMAIL?.toLowerCase() ? 'super_admin' : existing?.role ?? 'student';
  const userId = existing?.id ?? id('usr');

  if (existing) {
    await env.DB.prepare('UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), last_login = datetime("now"), is_verified = 1 WHERE id = ?')
      .bind(name ?? null, avatarUrl ?? null, existing.id)
      .run();
  } else {
    await env.DB.prepare('INSERT INTO users (id, email, name, avatar_url, role, is_verified, last_login) VALUES (?, ?, ?, ?, ?, 1, datetime("now"))')
      .bind(userId, normalizedEmail, name ?? displayNameFromEmail(normalizedEmail), avatarUrl ?? null, role)
      .run();
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<User>();
  if (!user) throw new Error('Could not create user');
  return user;
}

authRoutes.post(
  '/magic-link',
  zValidator('json', z.object({ email: z.string().email() })),
  rateLimit('magic-link', 3, 600),
  async (c) => {
    const { email } = c.req.valid('json');
    if (!isAllowedEmail(email, c.env.ALLOWED_EMAIL_DOMAIN)) {
      return fail(c, 403, `Use your @${c.env.ALLOWED_EMAIL_DOMAIN} or subdomain email address`);
    }

    const token = crypto.randomUUID() + crypto.randomUUID();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await c.env.DB.prepare('INSERT INTO auth_tokens (token, email, expires_at) VALUES (?, ?, ?)')
      .bind(token, email.toLowerCase(), expires)
      .run();

    const link = `${c.env.FRONTEND_URL}/auth/verify?token=${encodeURIComponent(token)}`;
    await sendEmail(c.env, email, 'Your University Issue Tracker sign-in link', `<p>Sign in with this secure link:</p><p><a href="${link}">${link}</a></p>`);
    return ok(c, { sent: true, devLink: c.env.RESEND_API_KEY ? undefined : link });
  }
);

authRoutes.get('/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) return fail(c, 400, 'Missing token');

  const authToken = await c.env.DB.prepare('SELECT * FROM auth_tokens WHERE token = ? AND used = 0').bind(token).first<{ email: string; expires_at: string }>();
  if (!authToken || new Date(authToken.expires_at).getTime() < Date.now()) return fail(c, 401, 'Invalid or expired token');

  const user = await upsertVerifiedUser(c.env, authToken.email);
  await c.env.DB.prepare('UPDATE auth_tokens SET used = 1 WHERE token = ?').bind(token).run();
  const session = await signSession(c.env, user);
  return ok(c, { token: session, user });
});

authRoutes.post('/google', zValidator('json', z.object({ credential: z.string().min(20) })), async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) return fail(c, 500, 'Google OAuth is not configured');

  const { credential } = c.req.valid('json');
  const { payload } = await jwtVerify(credential, googleJwks, {
    audience: c.env.GOOGLE_CLIENT_ID,
    issuer: ['https://accounts.google.com', 'accounts.google.com']
  });

  const email = String(payload.email ?? '').toLowerCase();
  if (!email || payload.email_verified !== true) return fail(c, 403, 'Google account email is not verified');
  if (!isAllowedEmail(email, c.env.ALLOWED_EMAIL_DOMAIN)) return fail(c, 403, `Use your @${c.env.ALLOWED_EMAIL_DOMAIN} Google account`);
  if (payload.hd && payload.hd !== c.env.ALLOWED_EMAIL_DOMAIN && !String(payload.hd).endsWith(`.${c.env.ALLOWED_EMAIL_DOMAIN}`)) return fail(c, 403, `Google Workspace domain must be ${c.env.ALLOWED_EMAIL_DOMAIN}`);

  const user = await upsertVerifiedUser(c.env, email, typeof payload.name === 'string' ? payload.name : undefined, typeof payload.picture === 'string' ? payload.picture : null);
  const token = await signSession(c.env, user);
  return ok(c, { token, user });
});

authRoutes.post('/logout', requireAuth, async (c) => {
  await c.env.KV.delete(`session:${c.get('token')}`);
  return ok(c, { loggedOut: true });
});

authRoutes.get('/me', requireAuth, async (c) => ok(c, c.get('user')));
