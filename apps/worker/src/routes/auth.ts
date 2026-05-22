import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../env';
import { assertAllowedEmail, clearSession, getAllowedEmailDomainsFromEnv, signSession, upsertUser } from '../services/auth.service';
import { verifyGoogleIdToken } from '../services/google-auth.service';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import { audit } from '../middleware/audit';
import { fail, ok } from '../utils/response';
import { id } from '../utils/ids';
import { now } from '../utils/dates';

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

authRoutes.post('/magic-link', rateLimit('magic-link', 5, 900), zValidator('json', z.object({ email: z.string().email() })), async (c) => {
  const { email } = c.req.valid('json');
  const allowedDomains = getAllowedEmailDomainsFromEnv(c.env);
  if (!assertAllowedEmail(email, allowedDomains)) return fail(c, 'INVALID_EMAIL_DOMAIN', 'Use your university email', 403);
  const linkId = id('magic');
  await c.env.DB.prepare('INSERT INTO auth_magic_links (id, email, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(linkId, email, linkId, new Date(Date.now() + 15 * 60 * 1000).toISOString(), now()).run();
  return ok(c, { sent: true, devLink: `/api/v1/auth/verify?token=${linkId}` });
});

authRoutes.get('/verify', async (c) => {
  const token = c.req.query('token') || '';
  const link = await c.env.DB.prepare('SELECT * FROM auth_magic_links WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?').bind(token, now()).first<{ email: string }>();
  if (!link) return fail(c, 'INVALID_TOKEN', 'Magic link is invalid or expired', 401);
  await c.env.DB.prepare('UPDATE auth_magic_links SET consumed_at = ? WHERE token_hash = ?').bind(now(), token).run();
  const userId = await upsertUser(c, link.email);
  const session = await signSession(c, userId);
  await audit(c, 'login', 'user', userId, { method: 'magic_link' });
  return ok(c, { token: session });
});

authRoutes.post('/google', rateLimit('google-login', 10, 900), zValidator('json', z.object({ idToken: z.string().min(1) })), async (c) => {
  const { idToken } = c.req.valid('json');
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) return fail(c, 'CONFIG_ERROR', 'Google OAuth is not configured', 503);
  const profile = await verifyGoogleIdToken(idToken, clientId);
  const allowedDomains = getAllowedEmailDomainsFromEnv(c.env);
  if (!assertAllowedEmail(profile.email, allowedDomains)) {
    return fail(c, 'INVALID_EMAIL_DOMAIN', 'Use your university email', 403);
  }
  const userId = await upsertUser(c, profile.email, profile.name);
  const session = await signSession(c, userId);
  await audit(c, 'login', 'user', userId, { method: 'google' });
  return ok(c, { token: session });
});

authRoutes.post('/logout', async (c) => {
  clearSession(c);
  return ok(c, { loggedOut: true });
});

authRoutes.get('/me', requireAuth(), (c) => ok(c, c.get('user')));

authRoutes.post('/refresh', requireAuth(), async (c) => ok(c, { token: await signSession(c, c.get('user').id) }));
