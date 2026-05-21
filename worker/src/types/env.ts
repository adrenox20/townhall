export type Role = 'student' | 'moderator' | 'dept_admin' | 'super_admin';

export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: Role;
  department: string | null;
  is_verified: number;
  is_banned: number;
  created_at: string;
  last_login: string | null;
};

export type Env = {
  DB: D1Database;
  KV: KVNamespace;
  R2?: R2Bucket;
  ALLOWED_EMAIL_DOMAIN: string;
  FRONTEND_URL: string;
  INITIAL_ADMIN_EMAIL?: string;
  JWT_SECRET: string;
  RESEND_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

export type AppVariables = {
  user: User;
  token: string;
};
