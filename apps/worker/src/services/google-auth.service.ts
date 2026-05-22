import { appError } from '../middleware/errors';

export type GoogleProfile = {
  email: string;
  name?: string;
  sub: string;
};

export async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<GoogleProfile> {
  if (!idToken) throw appError('INVALID_TOKEN', 'Google ID token is required', 401);
  if (!clientId) throw appError('CONFIG_ERROR', 'Google OAuth is not configured', 503);

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) throw appError('INVALID_TOKEN', 'Google sign-in could not be verified', 401);

  const data = (await res.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    sub?: string;
  };

  if (data.aud !== clientId) throw appError('INVALID_TOKEN', 'Invalid Google client', 401);
  if (!data.email || data.email_verified === 'false' || data.email_verified === false) {
    throw appError('INVALID_TOKEN', 'Google account email is not verified', 401);
  }
  if (!data.sub) throw appError('INVALID_TOKEN', 'Invalid Google profile', 401);

  return { email: data.email, name: data.name, sub: data.sub };
}
