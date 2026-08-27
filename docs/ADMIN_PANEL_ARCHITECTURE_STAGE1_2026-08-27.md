# Empire Admin Panel — Stage 1 Architecture Baseline

Date: 2026-08-27
Branch: `main`
Baseline: `8bd71e350cc56f461fd78e62584383520e4f05ea`

## Stage 1 status

**PASS — architecture is defined and the existing production surface is protected.**

This document is the execution contract for the requested six-stage Admin Panel upgrade. It supplements the earlier production-hardening audit without replacing it.

## Existing implementation inventory

The current Admin Panel is already a real application surface rather than a static mock. The shell exposes administration for overview, products, categories, orders, marketplace, sellers, users, banners, homepage, reviews, media, search, shipping, payments, payouts, reports, analytics, notifications, roles and audit. fileciteturn9file0L2-L2

Backend authorization is already centralized through `requireAdminApi`, which authenticates the current user, requires an admin role, loads a server-side access role, and checks permissions before allowing an operation. fileciteturn20file0L2-L2

Prisma + PostgreSQL is the authoritative persistence layer; the repository already has an architecture contract that rejects Drizzle runtime dependencies/imports and validates the Prisma PostgreSQL schema. fileciteturn13file0L2-L2

The CI pipeline already provisions PostgreSQL 16 and executes architecture/remediation contracts, Prisma generation/validation/migrations, lint, typecheck, tests, production dependency audit, build, and release checks. fileciteturn25file0L2-L2

## Critical domain gaps

### Seller / Store separation

The current Prisma schema places storefront profile data on `User`, including seller shop name, seller logo/banner, contact fields, address, and social links. `Product` uses nullable `sellerId`; there is no first-class `Store` model.

Target invariant:

```text
Seller = account/operator
Store  = commercial storefront
```

The migration must therefore be additive and compatibility-first:

1. Add `Store` and seller/store relationship tables.
2. Backfill stores from existing seller profiles.
3. Link existing products to their migrated store.
4. Migrate Admin and storefront reads/writes.
5. Enforce foreign keys and ownership.
6. Only retire legacy seller-profile fields after compatibility is verified.

### Brand separation

The current schema has no canonical `Brand` model or normalized product-to-brand relation. A first-class Brand entity must be added without treating Brand as Store, Seller, or Category.

### Product ownership

The product model currently proves seller ownership only. The target requires explicit store ownership plus optional seller attribution, enforced in the database and checked again in API authorization.

### Category model

Categories currently exist independently with a product relation. The target must preserve reusable category entities while allowing controlled store/category membership and hierarchical categories with deterministic display order.

## Final architecture

```text
User
 ├── Seller account / permissions
 │      └── Store
 │           ├── StoreBrand ── Brand
 │           ├── StoreCategory ── Category (hierarchical)
 │           └── Product
 │                ├── ProductBrand ── Brand
 │                ├── ProductMedia ── MediaAsset
 │                ├── Variants
 │                └── Related products
 │
 ├── Orders
 └── Admin RBAC

Site Settings
Homepage Sections
Homepage Banners
Media Library
Audit Log
```

## Six-stage execution contract

### Stage 1 — Architecture and baseline

Inventory the current repository, freeze working behavior, define domain invariants, identify migration boundaries, and verify the existing architecture contracts. No public route or healthy feature is removed.

### Stage 2 — Store management

Implement first-class Store persistence, seller association, CRUD/archive/status, branding/contact data, store categories/brands/sellers/products view, public preview, and additive backfill of legacy seller storefront data.

### Stage 3 — Brand, Category, Seller, Product separation

Implement normalized Brand persistence, store/category membership, explicit product store ownership, seller association, database foreign keys, validation, compatibility reads/writes, and migration-safe data integrity.

### Stage 4 — Product editor and media

Wire the product editor to real Store/Brand/Seller/Category relations; implement product images/gallery/media ownership, variants, attributes, related products, direct upload, validation, safe replacement and deletion guards.

### Stage 5 — Central Admin control

Unify Homepage, Banner, Users/Roles, Orders, Settings, search, analytics and audit flows around the new domain model. Internal navigation must use entity selectors where possible so broken internal links are prevented.

### Stage 6 — End-to-end production verification

Run database migrations, build, typecheck, lint, tests, API verification, RBAC verification, upload verification, CRUD flows, public preview flows, responsive checks, and release readiness. Any discovered defect is fixed before completion.

## Non-negotiable rules

- No fake/mock-only CRUD for production entities.
- No direct public privilege escalation from client-controlled role metadata.
- No UI-only permissions; backend authorization is mandatory.
- No destructive data-model rewrite without a backfill and compatibility path.
- No deletion of in-use media.
- No alteration of historical order snapshots to reflect new catalog ownership.
- No public URL breakage as a side effect of the Admin upgrade.
- Prisma remains the single schema authority.
- Future Coupon, Review, Wishlist, Shipping, Payment, Analytics and AI Product Management features must have clean extension points.
