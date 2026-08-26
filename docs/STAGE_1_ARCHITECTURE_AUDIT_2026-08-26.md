# Empire — Stage 1 Architecture Audit

Date: 2026-08-26
Baseline: `main` @ `8e134e85a0e6e9efa9c2863eae9bf8000c419535`
Scope: architecture, frontend/backend boundaries, API, database authority, authentication/admin boundaries, storage boundary, CI/release verification.

## Stage 1 result

**PASS WITH EXPLICIT BLOCKERS DEFERRED TO THEIR REQUIRED STAGES**

Stage 1 establishes the architecture baseline and identifies the work that must not be mixed into later stages. No existing storefront, order, payment, authentication, or public route was removed.

## Findings and priority

### P0 — Domain-model conflation

The current Prisma model has a `User` record acting as both seller account and store profile: `sellerShopName`, `sellerLogoUrl`, `sellerBannerUrl`, contact data, address data, and social links are stored on `User`. `Product` has an optional `sellerId`, but there is no canonical `Store` model and no `Brand` model or `brandId`. This prevents a strict `Seller -> Store -> Product` and `Brand -> Product` domain model.

**Disposition:** deferred to Stage 3, because changing this safely requires a dedicated additive migration, data backfill, API compatibility layer, and route/service migration. Doing it during Stage 1 would mix domain migration with architecture audit and increase regression risk.

### P0 — Product ownership is not store-scoped

`Product.sellerId` is nullable and there is no store foreign key. Current authorization can therefore prove seller ownership but cannot enforce that a product belongs to a specific store.

**Disposition:** Stage 3/4.

### P0 — Brand is not a first-class persistence concept

There is no `Brand` model and no `Product.brandId` relation in the current Prisma schema. Brand UI concepts therefore cannot be backed by a normalized foreign-key relation yet.

**Disposition:** Stage 3/4.

### P1 — Database authority needs explicit boundary

Prisma is the actual database layer. `src/db/schema.ts` is retained only as a deprecated Drizzle compatibility stub and must not become a second source of truth.

**Remediation:** Stage 1 documents Prisma as the sole authoritative ORM/schema and adds a CI architecture contract in this stage.

### P1 — Storage implementation is already centralized but needs a second-stage domain cleanup

`src/lib/storage.ts` is the central persistent storage boundary and supports Cloudinary plus the existing database-media fallback. This is architecturally preferable to scattered path handling, but image/video policy, folder conventions, entity ownership and orphan cleanup belong to Stage 2.

**Disposition:** Stage 2.

### P1 — CI quality pipeline is present

The main CI workflow provisions PostgreSQL, uses Node 24, installs with `npm ci`, runs Prisma generation/validation/migrations, lint, typecheck, tests, production dependency audit, build, and release checks.

**Remediation:** Stage 1 adds an architecture contract step so structural regressions are detected before later domain work is merged.

### P1 — Production environment is fail-closed

Production startup/readiness validation requires database/auth/site configuration and requires Cloudinary in production; the existing final hardening audit also records that real dependency/runtime verification still needs a Node 24/PostgreSQL-capable execution environment.

**Disposition:** keep current fail-closed behavior; full runtime verification is Stage 7.

### P2 — Legacy compatibility layers exist

Legacy DB markers, historical 2FA columns, and compatibility-oriented fields are intentionally retained. They are not removed in Stage 1 because destructive cleanup is not justified while preserving current data and APIs.

## Architectural target for later stages

```text
Seller (account / operator)
        |
        +----< Store (commercial storefront)
                   |
                   +----< Product >---- Brand
                              |
                              +---- Category
                              +---- ProductMedia
```

The migration must be additive first, then backfill existing seller-profile data into Store, then switch read/write paths, then enforce foreign keys, and only after verified compatibility may legacy seller-profile columns be retired.

## Stage boundary rules

- Stage 1 may establish architecture contracts and documentation.
- Stage 2 owns media/storage normalization.
- Stage 3 owns Seller/Store/Brand schema and API separation.
- Stage 4 owns product registration and product relation UX.
- Stage 5 owns the Admin control center for the new entities.
- Stage 6 owns presentation/UX integration.
- Stage 7 owns full end-to-end production verification.

No stage may silently perform another stage's destructive migration.
