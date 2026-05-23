# Contributing to Townhall

Thanks for your interest in contributing. This document covers how to get set up, the branching model, and what to expect from the review process.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Branching & Commits](#branching--commits)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Security Issues](#security-issues)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/townhall.git
   cd townhall
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/adrenox20/townhall.git
   ```

---

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is fine for local dev)
- A Google Cloud project with an OAuth 2.0 Client ID

### Steps

```bash
# Install dependencies
npm install

# Set up local Worker secrets
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit .dev.vars and fill in JWT_SECRET

# Set up frontend env
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local and fill in your Google Client ID

# Apply the local database schema and seed data
npm run db:migrate:local
npm run db:seed:local

# Start the Worker (in one terminal)
npm run dev:worker

# Start the frontend (in another terminal)
npm run dev
```

The frontend runs at `http://localhost:3000` and the Worker at `http://localhost:8787`.

---

## Project Structure

```
townhall/
├── apps/
│   ├── web/          # Next.js 15 frontend (static export)
│   └── worker/       # Cloudflare Worker API (Hono)
├── schema.sql        # D1 database schema
├── seed.sql          # Default roles, permissions, categories
└── openapi.yaml      # OpenAPI spec
```

Key directories inside `apps/worker/src/`:

| Directory | Purpose |
|-----------|---------|
| `routes/` | Hono route handlers |
| `middleware/` | Auth, RBAC, rate limiting, security headers, audit |
| `services/` | Business logic (auth, issues, notifications, etc.) |
| `db/` | Database query helpers |
| `durable-objects/` | Real-time IssueRoom and NotificationHub |
| `queues/` | Async notification consumer |
| `utils/` | Shared helpers (dates, IDs, responses) |

---

## Branching & Commits

- Branch off `main` for all changes.
- Use descriptive branch names: `feat/issue-voting`, `fix/logout-session-revoke`, `docs/setup-guide`.
- Keep commits focused. One logical change per commit.
- Commit message format (conventional commits preferred):
  ```
  type(scope): short description

  Optional longer explanation.
  ```
  Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

---

## Pull Request Process

1. Keep your branch up to date with `upstream/main` before opening a PR.
2. Fill in the PR template — describe what changed, why, and how to test it.
3. Make sure `npm run typecheck` passes before submitting.
4. PRs require at least one review from a maintainer before merging.
5. Squash-merge is preferred for feature branches; merge commits for release branches.

---

## Code Style

- TypeScript strict mode is enabled in both workspaces — no `any` without a comment explaining why.
- Follow the existing patterns in the codebase (Hono middleware, zod validation on all inputs, `ok()`/`fail()` response helpers).
- All new API endpoints must:
  - Validate request bodies with `zValidator` + a Zod schema.
  - Use `requireAuth()` and `requirePermission()` / `requireAnyPermission()` where appropriate.
  - Write an audit log entry for any privileged or state-changing action.
- Run `npm run typecheck` before pushing.

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/adrenox20/townhall/issues/new?template=bug_report.md) and include:

- Steps to reproduce
- Expected vs. actual behaviour
- Environment (browser, OS, Node version)
- Any relevant logs or screenshots

---

## Suggesting Features

Open a [GitHub Issue](https://github.com/adrenox20/townhall/issues/new?template=feature_request.md) with:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

For large changes, open a discussion first before writing code — it saves everyone time.

---

## Security Issues

**Do not open a public issue for security vulnerabilities.**

Please report them privately by emailing the maintainers or using [GitHub's private vulnerability reporting](https://github.com/adrenox20/townhall/security/advisories/new). See [SECURITY.md](SECURITY.md) for details.
