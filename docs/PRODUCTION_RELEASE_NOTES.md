# Eshop Production Release

This release standardizes the public brand as **Eshop / ایشاپ**, keeps the repository name unchanged, and hardens the marketplace catalog flow.

## Included

- Eshop brand identity in central site configuration and root metadata.
- Compact multilingual homepage advertisement backed by `HomepageAdvertisement` and a public read API.
- Data-driven Hero fallback so the homepage does not depend on a legacy `hero` badge.
- Category rail and filters on the main shop page.
- Responsive category directory with image cards and searchable navigation.
- Safe demo-product cleanup endpoint: `/api/admin/products/demo`.
- Demo catalog tagging for easy removal without touching Afghan traditional products.
- Header category labels no longer depend on missing `categoryNav.*` translation keys.

## Production gate

1. GitHub CI: lint, typecheck, Prisma validation/migrations, tests, audit and build.
2. Vercel deployment: Preview should be reviewed; Production deploy must come from `main`.
3. Production runtime checks: `/fa`, `/ps`, `/en`, `/fa/categories`, `/fa/shop`, `/fa/search`, `/fa/traditional`, product detail, login and register.
4. Database: confirm `DATABASE_URL` is available in Production and the migration history is synchronized.
