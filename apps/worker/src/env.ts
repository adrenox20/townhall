export type RoleName = 'student' | 'moderator' | 'institution_admin' | 'portal_admin';
export type Permission =
  | 'issue:create' | 'issue:read_public' | 'issue:update_own' | 'issue:update_any'
  | 'issue:delete_own_pre_review' | 'issue:delete_any' | 'issue:status_update' | 'issue:assign'
  | 'issue:merge' | 'issue:archive' | 'comment:create' | 'comment:moderate'
  | 'solution:create' | 'solution:review' | 'solution:official_select'
  | 'analytics:institution_read' | 'analytics:platform_read' | 'settings:manage'
  | 'rbac:manage' | 'audit:read' | 'user:suspend' | 'admin:manage';

export type User = {
  id: string;
  email: string;
  name: string;
  status: string;
  roles: RoleName[];
  permissions: Permission[];
};

export type Env = {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  NOTIFICATION_QUEUE: Queue;
  ISSUE_ROOMS: DurableObjectNamespace;
  NOTIFICATION_HUB: DurableObjectNamespace;
  JWT_SECRET: string;
  GOOGLE_CLIENT_SECRET?: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
  FRONTEND_URL: string;
  /** Comma-separated, e.g. rishihood.edu.in,nst.rishihood.edu.in */
  ALLOWED_EMAIL_DOMAINS?: string;
  ALLOWED_EMAIL_DOMAIN: string;
  GOOGLE_CLIENT_ID: string;
  SESSION_TTL_SECONDS: string;
  ISSUE_EDIT_WINDOW_MINUTES: string;
  DUPLICATE_LIKELY_THRESHOLD: string;
  DUPLICATE_RELATED_THRESHOLD: string;
  INITIAL_PORTAL_ADMIN_EMAIL?: string;
};

export type Variables = {
  requestId: string;
  user: User;
};
