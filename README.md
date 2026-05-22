# University Grievance Portal

Production MVP for a single-university grievance platform on Cloudflare.

## Stack

- Frontend: Next.js, React, TailwindCSS, shadcn-style primitives, Framer Motion-ready UI, React Query
- API: Cloudflare Workers with Hono
- Data: Cloudflare D1
- Files: Cloudflare R2
- Sessions, cache, and rate limits: Cloudflare KV
- Async notifications: Cloudflare Queues
- Realtime hooks: Durable Objects

## Local Setup

```bash
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev:worker
npm run dev:web
```

Set Worker secrets before deploying:

```bash
wrangler secret put JWT_SECRET --config apps/worker/wrangler.toml
wrangler secret put GOOGLE_CLIENT_ID --config apps/worker/wrangler.toml
wrangler secret put GOOGLE_CLIENT_SECRET --config apps/worker/wrangler.toml
```

Optional email delivery uses `RESEND_API_KEY` and `EMAIL_FROM`.

## Build

```bash
npm run build
```

## Database

`schema.sql` creates normalized D1 tables for users, RBAC, issues, workflow events, comments, solutions, attachments, notifications, audit logs, moderation, and settings. `seed.sql` installs default roles, permissions, role mappings, categories, departments, tags, and settings.

## Auth And RBAC

Signup is restricted by `ALLOWED_EMAIL_DOMAIN`. New users receive the `student` role. `INITIAL_PORTAL_ADMIN_EMAIL` bootstraps the first portal admin. Worker middleware supports:

- `requireAuth()`
- `requirePermission(permission)`
- `requireAnyPermission(permissions)`

Privileged workflow, merge, role, suspension, and settings actions write audit logs.

## Duplicate Detection

No external AI calls are used. The Worker normalizes text, removes stop words, applies simple suffix trimming, queries recent D1 candidates, and scores title overlap, description overlap, category, department, tags hook, recency, and location keywords.

## Deployment

- Deploy `apps/web` to Cloudflare Pages.
- Deploy the API with `wrangler deploy --config apps/worker/wrangler.toml`.
- Apply D1 migrations with `wrangler d1 execute university-grievance-db --file=schema.sql`.
- Seed with `wrangler d1 execute university-grievance-db --file=seed.sql`.
- Replace placeholder binding IDs in `wrangler.toml`.

OpenAPI source is in `openapi.yaml`; the Worker also exposes `/api/v1/openapi.json` and `/api/v1/docs`.
