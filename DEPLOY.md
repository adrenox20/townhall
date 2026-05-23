# Deploying Townhall

## Domain layout (recommended)

| Path | Target |
|------|--------|
| `https://yourdomain.com/*` | Cloudflare Pages (Next.js static `apps/web/out`) |
| `https://api.yourdomain.com/*` | Cloudflare Worker (`apps/worker`) |

## Google Cloud Console

Create an OAuth 2.0 Client ID at [console.cloud.google.com](https://console.cloud.google.com):

1. **Authorized JavaScript origins:** `https://yourdomain.com`, `http://localhost:3000`
2. **Authorized redirect URIs:** not required for Google Identity Services (ID token flow).

Copy the generated Client ID into `wrangler.toml` → `GOOGLE_CLIENT_ID` and into `apps/web/.env.production` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Worker setup

### 1. Create Cloudflare resources

```bash
# Create D1 database
wrangler d1 create university-grievance-db

# Create KV namespace
wrangler kv:namespace create KV

# Create R2 bucket
wrangler r2 bucket create university-grievance-attachments

# Create Queue
wrangler queues create grievance-notifications
```

Copy the IDs printed by each command into `apps/worker/wrangler.toml`.

### 2. Set secrets (run once per environment)

```bash
cd apps/worker
wrangler secret put JWT_SECRET
# Optional: email delivery
wrangler secret put RESEND_API_KEY
```

### 3. Update wrangler.toml vars

Edit `apps/worker/wrangler.toml` and replace all `REPLACE_WITH_*` placeholders:

| Var | Description |
|-----|-------------|
| `FRONTEND_URL` | Your production frontend URL |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated university email domains (e.g. `uni.edu,dept.uni.edu`) |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `INITIAL_PORTAL_ADMIN_EMAIL` | Email of the first portal admin (bootstrapped on first login) |
| `database_id` | D1 database ID from step 1 |
| `kv_namespaces.id` | KV namespace ID from step 1 |

### 4. Apply schema and seed

```bash
wrangler d1 execute university-grievance-db --remote --file=../../schema.sql
wrangler d1 execute university-grievance-db --remote --file=../../seed.sql
```

### 5. Deploy the Worker

```bash
cd apps/worker
wrangler deploy
```

Set a **custom domain** for the Worker route in the Cloudflare dashboard (e.g. `api.yourdomain.com`).

## Frontend (Cloudflare Pages)

### 1. Configure environment

Copy `apps/web/.env.production` and fill in your values:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS=youruniversity.edu
```

### 2. Build and deploy

```bash
cd apps/web
npm run build
# Deploy the ./out directory to Cloudflare Pages
```

## First portal admin

Set `INITIAL_PORTAL_ADMIN_EMAIL` in `wrangler.toml` to the Google account that should bootstrap as portal admin. On first login with that email, the user is automatically assigned the `portal_admin` role.

## Allowed email domains

Configure `ALLOWED_EMAIL_DOMAINS` in `wrangler.toml` as a comma-separated list. Subdomain matching is supported automatically (e.g. `user@dept.uni.edu` is allowed if `uni.edu` is in the list).
