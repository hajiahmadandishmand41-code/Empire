# Empire Shop — Final Production Hardening Audit

Date: 2026-08-15

## Result

**NOT PRODUCTION READY**

The repository has been hardened further, but the supplied execution environment does not contain Node 24, PostgreSQL, Redis/Upstash, Docker, or a working npm dependency installation. Therefore the required real integration, migration, Docker, audit, and E2E verification could not honestly be marked as passed.

## Changes in this hardening pass

- Added strict production startup environment validation.
- Production now requires PostgreSQL, distributed Redis rate limiting, persistent Cloudinary storage, authentication secret, and ATOMA Pay credentials.
- Production explicitly rejects demo/mock authentication and CSP report-only mode.
- Public `/api/health` and `/api/healthz` expose only `{ ok: true }`.
- Added protected `/api/health/internal` for DB/migration readiness diagnostics.
- Replaced production CSP `unsafe-inline` script execution with per-request nonce + `strict-dynamic`.
- Propagated the nonce through the Next.js proxy request.
- Removed production API mock/fallback responses from seller, notification, wishlist, search, reviews, shipping and related routes.
- Removed shipping fallback data from the production API.
- Production rate limiting now uses the async distributed limiter at the proxy/global API layer.
- ATOMA mock payments now require explicit `APP_MODE=demo`; missing provider credentials fail otherwise.
- Webhook amount verification uses Prisma Decimal rather than floating-point arithmetic.
- Provider, method and provider-transaction identity are validated for ATOMA callbacks.
- Payment verification returns money as canonical decimal strings instead of converting to JS Number.
- Order subtotal, shipping and total calculations now use Prisma Decimal.
- Seller wallet commission, seller earnings, refunds and payout amounts now use Decimal arithmetic.
- Seller payout API accepts a decimal string, avoiding a client Number conversion at the API boundary.
- COD delivery now settles an actual transaction record atomically with the order status/payment update.
- Added currency DB constraints and an order total invariant migration.
- Added a uniqueness constraint preventing duplicate transaction states for the same order/method/status.
- CI now starts PostgreSQL and applies real Prisma migrations before tests.
- Added Decimal finance unit tests.
- Removed the hardcoded mock demo password; demo authentication now requires `DEMO_PASSWORD`.
- Tightened production image remote patterns and disabled placeholder image hosts in production.
- Docker startup validates production configuration before migrations/application startup.

## Verification performed in this environment

- JavaScript configuration/script syntax checks: **PASS**
- TypeScript/TSX transpilation syntax check across 431 files: **PASS**
- Production environment validator with missing variables: **PASS** (correctly failed closed)
- Production environment validator with non-secret dummy values: **PASS**
- Repository scan for API mock/fallback responses: **PASS — none found in API routes**
- Repository scan for obvious committed secret patterns: **PASS**
- `npm ci`: **NOT VERIFIED** — environment provides Node 22.16.0 while project requires Node 24.x; dependency installation could not complete.
- `npm run lint`: **NOT VERIFIED** — dependencies unavailable.
- `npm run typecheck`: **NOT VERIFIED** — dependencies/type definitions unavailable.
- `npx prisma validate`: **NOT VERIFIED** — Prisma CLI unavailable because dependencies could not be installed.
- `npm test`: **NOT VERIFIED** — dependencies unavailable.
- `npm run build`: **NOT VERIFIED** — dependencies unavailable.
- `npm audit`: **NOT VERIFIED** — npm dependency installation/network verification unavailable.
- PostgreSQL migration/integration tests: **NOT VERIFIED** — PostgreSQL unavailable.
- Redis distributed rate-limit tests: **NOT VERIFIED** — Redis/Upstash unavailable.
- Docker build/run: **NOT VERIFIED** — Docker unavailable.
- Full E2E purchase flow: **NOT VERIFIED** — required runtime services unavailable.
- 100-concurrent-last-stock test: **NOT VERIFIED** — PostgreSQL unavailable.
- Duplicate payment callback concurrency test: **NOT VERIFIED** — PostgreSQL/provider runtime unavailable.
- Payout race test: **NOT VERIFIED** — PostgreSQL unavailable.

## Production environment variables

Required:

- `DATABASE_URL`
- `AUTH_SECRET` (minimum 32 characters)
- `NEXT_PUBLIC_SITE_URL` (HTTPS in production)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ATOMA_PAY_MERCHANT_ID`
- `ATOMA_PAY_API_KEY`
- `ATOMA_PAY_WEBHOOK_SECRET`

Recommended/conditional:

- `DATABASE_URL_UNPOOLED` for migration deployment through pooled DB providers
- `ATOMA_PAY_BASE_URL`
- `CLOUDINARY_UPLOAD_FOLDER`
- SMTP variables if transactional email is enabled
- Twilio variables if SMS is enabled
- OAuth variables if Google OAuth is enabled
- `METRICS_TOKEN` for protected internal health monitoring

Never set in production:

- `APP_MODE=demo`
- `ALLOW_MOCK_AUTH=true`
- `CSP_REPORT_ONLY=true`

## Deploy sequence

1. Use Node 24.x.
2. Configure every required production environment variable.
3. Install with `npm ci`.
4. Build with `npm run build`.
5. Run the production image/container.
6. Container startup validates the environment, runs `prisma migrate deploy`, then starts Next.js.
7. Verify `/api/healthz` returns `{ "ok": true }`.
8. Verify the protected `/api/health/internal` endpoint with `METRICS_TOKEN`.
9. Run the complete CI/integration/E2E suite against real PostgreSQL and the configured payment/storage/rate-limit services before release.

## Final verdict

**NOT PRODUCTION READY**
