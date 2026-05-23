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

export const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// 10 login attempts per IP per 15 minutes
authRoutes.post('/google', rateLimit('auth:google', 100, 900), zValidator('json', z.object({ idToken: z.string().min(1) })), async (c) => {
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
  await clearSession(c);
  return ok(c, { loggedOut: true });
});

authRoutes.get('/me', requireAuth(), (c) => ok(c, c.get('user')));

authRoutes.post('/refresh', requireAuth(), async (c) => ok(c, { token: await signSession(c, c.get('user').id) }));
