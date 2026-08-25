# Empire — 8-Stage Production & Hosting Readiness

This runbook is the canonical deployment path for Vercel, Docker, VPS, or another standard Node.js host.

## Stage 1 — Environment contract

Required runtime variables are documented in `.env.example`. Production secrets must be supplied by the host's secret manager/environment settings; never commit real values.

Minimum application contract:
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Optional integrations are provider-specific (Redis, storage/CDN, email, SMS, payments, AI). The application must fail closed when a required production integration is enabled but not configured.

## Stage 2 — Database deployment

Run migrations separately from the image build:

```bash
npm ci
npm run db:generate
npm run db:deploy
```

`prisma migrate deploy` must be the production migration mechanism. Never use `prisma db push` against production.

Before release, take/verify a backup and perform a restore drill against a disposable database.

## Stage 3 — Portable build/runtime

The application must run without Vercel-specific APIs:

```bash
npm ci
npm run build
npm start
```

For containers:

```bash
docker build -t empire:production .
docker run --env-file .env.production -p 3000:3000 empire:production
```

The Dockerfile uses the Next.js standalone output and binds the runtime to `0.0.0.0`.

## Stage 4 — External services

Configure and verify each integration independently:
- PostgreSQL
- Redis/rate-limit/cache, where enabled
- object storage/CDN
- email/SMS
- payment provider and webhook endpoint
- scheduled jobs/cron

Webhook endpoints must be public, HTTPS, signature-verified, idempotent, and mapped to the current deployment.

## Stage 5 — Security gate

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run audit:prod
npm run production:check
```

Production secrets must not appear in logs, CLI arguments, committed files, or client-side environment variables.

## Stage 6 — Functional E2E gate

Against staging/new production:

```bash
E2E_BASE_URL=https://example.com npm run e2e:smoke
```

The release gate must additionally cover:
`register → login → product → cart → checkout → payment → webhook → order → inventory → seller wallet → payout`.

Payment and webhook testing must use a provider sandbox/test environment unless a controlled production canary is explicitly approved.

## Stage 7 — Performance & resilience

Database:

```bash
DATABASE_URL='postgresql://...' npm run db:benchmark
```

Read-only load test:

```bash
STRESS_BASE_URL=https://staging.example.com npm run stress:test
```

Do not run write stress against real production data. Benchmark p50/p95/max latency, error rate, connection saturation, and inventory race behavior.

## Stage 8 — Release, monitoring, rollback

Release checklist:

1. CI green.
2. Migration dry-run/verification complete.
3. New deployment is healthy.
4. `/api/healthz` returns 200.
5. Product API responds with expected envelope.
6. E2E smoke passes.
7. Payment/webhook canary passes.
8. Monitoring is active.
9. Backup is current.
10. Rollback target is known.

Rollback order:
1. Revert application deployment.
2. Do not automatically downgrade database migrations.
3. If a schema rollback is required, use a forward-compatible corrective migration.
4. Confirm health/readiness and critical business flows.

## Hosting portability definition

A host is considered supported only when all eight stages pass. A green build alone is not production readiness.
