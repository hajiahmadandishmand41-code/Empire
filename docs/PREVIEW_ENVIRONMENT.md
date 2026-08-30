# Preview Environment Contract

The Preview deployment must provide the same server-side database connection contract as Production. No fallback or mock database is permitted.

Required server-side database variables (one supported PostgreSQL connection URL is sufficient):

- `DATABASE_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL`
- `STORAGE_POSTGRES_PRISMA_URL`
- `STORAGE_POSTGRES_URL`
- `SUPABASE_DB_URL`

The application resolves these aliases in `src/lib/db.ts` and never exposes their values to the client.

Preview without a database intentionally renders a Persian/locale-aware unavailable state and returns a failing deep-health status. It must not manufacture catalog data.

For a fully data-backed Preview, the Vercel Preview environment must be granted one of the supported server-only database variables using the Vercel project environment-variable UI or an equivalent secured deployment mechanism. Secret values must never be committed to Git.
