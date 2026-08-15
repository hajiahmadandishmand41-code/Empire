# Empire Shop — Production Readiness Report

Scope: audit only + minimal, non-behavioural hardening.
No file, page, route, API, component, Prisma model, translation, script,
dependency or UI element was removed or redesigned.

## Audit Summary

The project was already in a strong state:

- Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui + next-intl (en/fa/ps).
- Auth: HMAC-SHA256 signed, `httpOnly` + `secure` (prod) + `SameSite=Lax` session cookie;
  `AUTH_SECRET` (min 32 chars) is enforced fatally in production.
- Mock auth (`src/lib/auth/mock-users.ts`) is blocked outside development unless
  `ALLOW_MOCK_AUTH=true` — verified in login/register routes and `current-user.ts`.
- `src/proxy.ts` (middleware): same-origin/CSRF check for POST/PUT/PATCH/DELETE,
  global API rate limiting, security headers + CSP nonce, route guards for
  `/profile`, `/admin`, `/seller`.
- `/api/metrics` fails closed (401 without `METRICS_TOKEN`) and uses constant-time compare.
- `/api/health` and `/api/healthz` report DB + migration state without leaking data.
- `next.config.mjs`: no wildcard image hosts, HSTS in production, `poweredByHeader: false`.
- No hardcoded secrets, API keys, passwords, tokens or private keys found in
  `src/`, `scripts/` or `prisma/`. `.gitignore` ignores `.env*` except `.env.example`.
- Prisma migrations are forward-only through `scripts/migrate-deploy.mjs`
  (never `reset` / `--force-reset`), with pooled-connection warnings.

## Changes Made

### Docker
- `Dockerfile`:
  - `ENV HOSTNAME=0.0.0.0` in the runner. **Bug fix:** Next.js standalone binds to
    `localhost` by default, so the published container port was unreachable.
  - `ENV SKIP_DB_MIGRATE=1` in the builder so image builds never contact a database
    (reproducible builds; migrations stay a deploy-time step).
  - `COPY prisma` into the runner so `prisma migrate deploy` can be run from the image.
  - `HEALTHCHECK` against `/api/healthz`.
- `docker-compose.yml`: added `healthcheck` and `stop_grace_period: 30s`
  (graceful shutdown). No service, env var or port was changed.

### CI/CD & GitHub security
- Added `.github/dependabot.yml` (npm, github-actions, docker; weekly).
- Added `.github/workflows/codeql.yml` (javascript-typescript, security-and-quality).
- Added `.github/workflows/dependency-review.yml` (fail on high severity).
- Existing `ci.yml` and `deploy.yml` were reviewed and left unchanged — they already
  run install, lint, typecheck, `prisma validate`, tests, `npm audit --omit=dev`, build,
  and publish to GHCR with least-privilege `permissions`.

### Security fixes
- No exploitable issue was found that required a code change. The Docker `HOSTNAME`
  fix and build-time DB isolation are the only production-affecting corrections.

### Database
- No schema, model, field or migration change. Migration strategy verified
  (forward-only `prisma migrate deploy`, direct/unpooled URL preference).

## Test Results (Node 22 sandbox; project targets Node 24)

| Check | Result |
| --- | --- |
| Lint (`npm run lint`) | PASS |
| TypeScript (`npm run typecheck`) | PASS |
| Tests (`npm test`) | PASS (1/1) |
| Build (`npm run build`, `SKIP_DB_MIGRATE=1`) | PASS |
| Prisma (`prisma generate` / schema load) | PASS |
| Docker build | NOT RUN — no Docker daemon in the audit environment |
| `npm audit --omit=dev` | NOT RUN — registry audit endpoint unavailable in the audit environment |

## Files Added
- `.github/dependabot.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/dependency-review.yml`
- `PRODUCTION_READINESS.md`

## Files Modified
- `Dockerfile`
- `docker-compose.yml`

## Files Deleted
NONE

## Features Removed
NONE

## Features Added
NONE (only the technical configuration listed under "Files Added")

## UI Changes
NONE

## Remaining Manual Steps (owner only)
1. Run `npm audit --omit=dev --audit-level=high` on a machine with npm registry access
   and update only compatible versions.
2. Verify `docker build .` and `docker compose up` on a host with Docker.
3. GitHub → Settings → Code security: enable Secret scanning + push protection,
   Dependabot alerts/security updates, and CodeQL default/advanced setup.
4. Add branch protection / ruleset on `main` requiring the CI job.
5. Configure production secrets (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`,
   `NEXT_PUBLIC_SITE_URL`, `METRICS_TOKEN`, payment/SMTP/SMS keys) in the hosting
   platform and GitHub Secrets — never in the repository.
6. Provision the production PostgreSQL instance, apply `npm run db:deploy`,
   and schedule `scripts/backup.sh` / verify `scripts/restore.sh`.
7. Point DNS/domain at the deployment and confirm HTTPS so HSTS applies.
