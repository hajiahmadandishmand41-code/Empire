# Empire / iShop — Production Stabilization Audit

Date: 2026-08-30
Base: `main` @ `a32ac859b92cdf7de8c30139f1ada4ea9ed24d8a`
Working branch: `stabilize/production-hardening-2026-08-30`

## Scope

Audit coverage includes application routing, Next.js App Router/i18n, auth/authorization, API contracts, Prisma/database access, object storage/image delivery, admin/seller workflows, storefront/catalog, cart/checkout/orders, reviews/messages, caching/rendering, deployment and CI quality gates.

## Route inventory observed in repository

Primary locale subtree contains:

- `/[locale]/brands`
- `/[locale]/stores`
- `/[locale]/traditional`
- `/[locale]/categories`
- `/[locale]/category`
- `/[locale]/cart`
- `/[locale]/checkout`
- `/[locale]/discounts`
- `/[locale]/discover`
- `/[locale]/admin/**`
- `/[locale]/auth/**`
- `/[locale]/seller/**`

The repository also contains dedicated product/catalog services and Prisma repositories rather than a mock storefront fallback.

## Environment contract extracted from source

Required/production-critical variables include:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `POSTGRES_URL_NON_POOLING`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER`
- Atoma Pay variables when online payment is enabled

Optional but security-sensitive variables include `ALLOW_MOCK_AUTH`, `APP_MODE`, `SESSION_SECRET`, `NEXTAUTH_SECRET`, Google OAuth, SMTP/SMS, Upstash, and observability variables. Secret values are never recorded here.

## Deployment observations

- Production deployment for `main` at the audited commit is `READY`.
- Production `/api/health/deep` has been externally queried successfully.
- The latest production deployment currently has no error/fatal runtime logs in the available recent retention window.
- The Preview deployment URL is protected by Vercel SSO; authenticated browser-level preview verification cannot be inferred from public HTTP access and must not be bypassed.
- Historical preview failures exist and must be treated as regression evidence until reproduced or disproved by current verification.

## Known historical build failure

A historical preview deployment failed typechecking in `src/app/[locale]/seller/products/page.tsx` because an obsolete `result.source === 'mock'` branch conflicted with the typed union `empty | db | unavailable`. The current `main` source no longer contains that branch and renders the explicit empty state from the typed result.

## Current risk findings requiring verification/fix

1. Database failure semantics must be checked end-to-end so `unavailable` is not collapsed into an empty array.
2. Audit JSON serialization is intentionally strict and rejects non-JSON runtime values; every audit producer must pass a plain JSON-safe snapshot.
3. Product repositories use relation includes and separate count/rating queries; query volume and indexes need measured verification.
4. `getProductBySlug` / `getProductById` currently make view-counter updates best-effort; failures must remain observable rather than disappearing silently.
5. Image optimization is configured through Next.js remote patterns, while standalone output is disabled on Vercel; the historical `_next/image.js` failure must be verified against current deployments/build packaging.
6. Preview environment parity must be checked by variable names/targets and health probes without exposing secret values.
7. Main storefront/admin/seller routes need HTTP/browser regression coverage for `/fa`, `/ps`, and `/en` where supported by the locale middleware.

## Gate policy

No phase is considered PASS until source evidence, tests, deployment state, and runtime/browser verification support the result. Database unavailable and database empty are distinct states. Production authentication is never bypassed for testing.

## Status at audit start

- Gate 1: IN PROGRESS — coverage established; root causes still being verified.
- Gate 2+: NOT STARTED until Gate 1 closes.
