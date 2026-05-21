# University Issue Tracker

Full-stack campus issue tracker for Cloudflare's free tier:

- `frontend/`: React, TypeScript, Vite, TailwindCSS, TanStack Query, React Router.
- `worker/`: Cloudflare Workers, Hono, D1, KV, R2, Resend-ready email flow.
- `schema.sql`: D1 schema and indexes.
- `seed.sql`: starter categories and tags.

## Local Setup

```bash
npm run install:all
npm run dev:worker
npm run dev:frontend
```

The frontend defaults to `http://localhost:5173` and calls the Worker at `http://localhost:8787`.

## Cloudflare Setup

```bash
wrangler d1 create issue-tracker-db
wrangler d1 execute issue-tracker-db --file=./schema.sql
wrangler d1 execute issue-tracker-db --file=./seed.sql
wrangler kv:namespace create KV
wrangler r2 bucket create issue-tracker-attachments
cd worker
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
wrangler deploy
```

Update `worker/wrangler.toml` with your D1 and KV IDs before deploying.
