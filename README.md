# Townhall

A self-hosted student grievance portal for universities. Students sign in with their university Google account, submit issues, track progress, and engage with resolutions — all within a role-based workflow designed for campus governance.

[![CI](https://github.com/adrenox20/townhall/actions/workflows/ci.yml/badge.svg)](https://github.com/adrenox20/townhall/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- Google OAuth login restricted to configured university email domains
- Issue submission with categories, departments, tags, and file attachments
- Role-based access control: `student`, `moderator`, `institution_admin`, `portal_admin`
- Issue workflow: `pending_review` → `open` → `in_progress` → `resolved` / `closed`
- Duplicate detection (no external AI — pure text normalization and scoring)
- Real-time updates via Durable Objects
- Async email notifications via Cloudflare Queues
- Audit log for all privileged actions
- Moderation queue, merge/relate issues, kanban view, analytics dashboard

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TailwindCSS, React Query |
| API | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| File storage | Cloudflare R2 |
| Sessions & cache | Cloudflare KV |
| Async jobs | Cloudflare Queues |
| Real-time | Durable Objects |

Everything runs on Cloudflare's free or low-cost tiers.

## Quick Start (local)

### Prerequisites

- Node.js 20+
- npm 10+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- A Google Cloud OAuth 2.0 Client ID

### Setup

```bash
# 1. Clone and install
git clone https://github.com/adrenox20/townhall.git
cd townhall
npm install

# 2. Worker secrets (local)
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit .dev.vars — set JWT_SECRET to any random string

# 3. Frontend env (local)
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local — set NEXT_PUBLIC_GOOGLE_CLIENT_ID

# 4. Seed the local database
npm run db:migrate:local
npm run db:seed:local

# 5. Start (two terminals)
npm run dev:worker   # http://localhost:8787
npm run dev          # http://localhost:3000
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full step-by-step guide to deploying on Cloudflare Pages + Workers.

## Configuration

All configuration is done through `apps/worker/wrangler.toml` (non-secret vars) and `wrangler secret put` (secrets). Key vars:

| Var | Description |
|-----|-------------|
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated university email domains |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `INITIAL_PORTAL_ADMIN_EMAIL` | Email bootstrapped as first portal admin |
| `FRONTEND_URL` | Production frontend URL (used for CORS and cookies) |
| `JWT_SECRET` | Secret for signing session JWTs (set via `wrangler secret put`) |

## Auth & RBAC

- Login is restricted to `ALLOWED_EMAIL_DOMAINS`. Subdomain matching is supported.
- New users receive the `student` role automatically.
- `INITIAL_PORTAL_ADMIN_EMAIL` is assigned `portal_admin` on first login.
- Middleware: `requireAuth()`, `requirePermission(p)`, `requireAnyPermission([p1, p2])`

## Database

`schema.sql` defines all D1 tables. `seed.sql` installs default roles, permissions, categories, departments, and tags. Run migrations with:

```bash
# Local
npm run db:migrate:local

# Remote (production)
wrangler d1 execute university-grievance-db --remote --file=schema.sql
```

## API

OpenAPI spec: `openapi.yaml` — also served live at `/api/v1/openapi.json` and `/api/v1/docs`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## License

[MIT](LICENSE)
