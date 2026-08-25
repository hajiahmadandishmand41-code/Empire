# Production Hardening Runbook

This repository now has a five-layer production hardening gate:

1. **Deploy/CI errors** — lint, typecheck, Prisma validation/migrations, tests, dependency audit, build, and release checks must be green.
2. **API/E2E** — read-only smoke tests verify health, readiness, product API, and the Shop page against a real deployment.
3. **Checkout/Payment/Inventory stress** — the existing inventory race test plus a guarded HTTP stress harness are available. Mutating traffic is opt-in and must target a disposable staging environment.
4. **PostgreSQL benchmarking** — representative product/category reads are timed and reported as p50/p95/max without changing data.
5. **Production monitoring** — a scheduled workflow probes public health/readiness/product endpoints and fails on unhealthy responses.

## Local quality gate

```bash
npm ci
npm run production:check
```

## API/E2E smoke

```bash
E2E_BASE_URL=https://staging.example.com npm run e2e:smoke
```

The Vitest smoke contract also runs when `E2E_BASE_URL` or `PRODUCTION_URL` is set.

## PostgreSQL benchmark

```bash
DATABASE_URL='postgresql://...' npm run db:benchmark
```

Use a representative staging database or read replica. Do not run repeated benchmarks against a busy production primary.

## Safe stress testing

Start read-only:

```bash
STRESS_BASE_URL=https://staging.example.com \
STRESS_PATH='/api/products?limit=1' \
STRESS_CONCURRENCY=25 \
STRESS_REQUESTS=500 \
npm run stress:test
```

Mutating methods are blocked by default. Checkout/payment/order scenarios require an explicit staging target:

```bash
STRESS_WRITE=true STRESS_TARGET=staging
```

Never put credentials, card data, OTPs, or customer PII in stress bodies or logs.

## Production monitoring

Set `PRODUCTION_URL` as a GitHub repository or environment variable. The scheduled workflow checks:

- `/api/health`
- `/api/healthz`
- `/api/products?limit=1`

The monitor is read-only and does not expose environment values.

## Release policy

A production release is ready only when CI is green, the Vercel deployment is READY, migrations succeed, API/E2E smoke passes against the new deployment, inventory concurrency tests pass, staging checkout/payment/webhook tests pass, benchmark p95 stays inside the agreed SLO, and production monitors remain healthy.

### Starting SLOs

- Public health: **p95 < 250 ms**
- Product list: **p95 < 750 ms**
- Rolling error rate: **< 1% over 15 minutes**
- Checkout/order writes: measure and gate in staging before release

These are initial engineering thresholds and should be tuned from real traffic.
