import { SignJWT, jwtVerify } from 'jose';
import type { Env, User } from '../types/env';

const encoder = new TextEncoder();

export async function signSession(env: Env, user: User) {
  const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encoder.encode(env.JWT_SECRET));

  await env.KV.put(`session:${token}`, user.id, { expirationTtl: 60 * 60 * 24 * 7 });
  return token;
}

export async function verifySession(env: Env, token: string) {
  const key = `session:${token}`;
  const userId = await env.KV.get(key);
  if (!userId) return null;

  await jwtVerify(token, encoder.encode(env.JWT_SECRET));
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND is_banned = 0').bind(userId).first<User>();
  return user ?? null;
}

export function getBearerToken(header: string | null) {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

export function isAllowedEmail(email: string, domain: string) {
  const normalizedEmail = email.toLowerCase();
  const normalizedDomain = domain.toLowerCase();
  // Allow exact domain match or any subdomain (e.g. nst.rishihood.edu.in matches rishihood.edu.in)
  return normalizedEmail.endsWith(`@${normalizedDomain}`) || normalizedEmail.endsWith(`.${normalizedDomain}`);
}

export function displayNameFromEmail(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
