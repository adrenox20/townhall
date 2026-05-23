# Deploy to rutownhall.live

## Domain layout (recommended)

| Path | Target |
|------|--------|
| `https://rutownhall.live/*` | Cloudflare Pages (Next.js static `apps/web/out`) |
| `https://api.rutownhall.live/*` | Cloudflare Worker (`apps/worker`) |

Same-origin cookies require API and web on **one hostname**.

## Google Cloud Console

For client ID `968761038415-dsp50r3h47b32imjd7nj4m9u2vjm623k.apps.googleusercontent.com`:

1. **Authorized JavaScript origins:** `https://rutownhall.live`, `http://localhost:3000`
2. **Authorized redirect URIs:** not required for Google Identity Services button (ID token flow).

## Worker secrets (run once)

```bash
cd apps/worker
wrangler secret put JWT_SECRET
# Optional: wrangler secret put GOOGLE_CLIENT_SECRET
```

`GOOGLE_CLIENT_ID` and email domains are in `wrangler.toml` `[vars]`.

Replace `REPLACE_ME` in `wrangler.toml` with your D1 and KV IDs, then:

```bash
wrangler d1 execute university-grievance-db --remote --file=../../schema.sql
wrangler d1 execute university-grievance-db --remote --file=../../seed.sql
wrangler deploy
```

Set **custom domain** `rutownhall.live` on the Worker route for `/api/*`.

## Frontend (Pages)

```bash
cd apps/web
npm run build
# Deploy ./out to Cloudflare Pages project, custom domain rutownhall.live
```

Production env is in `.env.production` (`NEXT_PUBLIC_API_URL=https://api.rutownhall.live/api/v1`).

## First portal admin

Set `INITIAL_PORTAL_ADMIN_EMAIL` in `wrangler.toml` to the Google account that should bootstrap as portal admin (default: `admin@nst.rishihood.edu.in`). Change it to your email before first login if needed.

## Allowed email domains

- `rishihood.edu.in`
- `nst.rishihood.edu.in`
- Any subdomain of those domains (e.g. `user@dept.rishihood.edu.in`)

Configured via `ALLOWED_EMAIL_DOMAINS` in Worker vars.
