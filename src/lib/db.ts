/**
 * Prisma client singleton.
 *
 * Vercel/Supabase Marketplace can expose the same PostgreSQL database through
 * several connection-variable names. Prefer the Marketplace-managed pooler
 * URLs over manually-added direct URLs so runtime and migrations target the
 * same database without requiring IPv6 support on Vercel.
 *
 * No secret values are logged.
 */
import { PrismaClient } from '@prisma/client';

const DATABASE_URL_KEYS = [
  'STORAGE_POSTGRES_PRISMA_URL',
  'STORAGE_POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'STORAGE_POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL_NON_POOLING',
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'SUPABASE_DB_URL',
] as const;

function resolveDatabaseUrl(): string | undefined {
  for (const key of DATABASE_URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function normalizeServerlessUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);

    // Do not force a connection_limit here. Marketplace-managed pooled URLs
    // already carry provider-appropriate limits, while forcing `2` caused
    // production P2024 pool exhaustion on the homepage. An explicit
    // PRISMA_CONNECTION_LIMIT can still be supplied when the database owner
    // has a known hard connection budget.
    const configuredLimit = Number.parseInt(process.env.PRISMA_CONNECTION_LIMIT ?? '', 10);
    if (!url.searchParams.has('connection_limit') && Number.isInteger(configuredLimit) && configuredLimit > 0) {
      url.searchParams.set('connection_limit', String(configuredLimit));
    }

    // Keep the timeout configurable; 20s is the provider-safe default when
    // nothing is specified. A shorter value may be useful in production, but
    // should be an operational choice rather than a code-imposed value.
    const configuredPoolTimeout = Number.parseInt(process.env.PRISMA_POOL_TIMEOUT ?? '', 10);
    if (!url.searchParams.has('pool_timeout') && Number.isInteger(configuredPoolTimeout) && configuredPoolTimeout > 0) {
      url.searchParams.set('pool_timeout', String(configuredPoolTimeout));
    }

    return url.toString();
  } catch {
    return raw;
  }
}

// Prisma's datasource is intentionally defined as env("DATABASE_URL").
// Normalize the preferred Marketplace-managed URL into the canonical variable
// without overriding provider-managed pool settings.
const resolvedDatabaseUrl = normalizeServerlessUrl(resolveDatabaseUrl());
if (resolvedDatabaseUrl) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Keep one Prisma client per warm serverless runtime in every environment.
// This is critical on Vercel because creating multiple clients in production
// can multiply database connections and trigger P2024 pool timeouts.
globalForPrisma.prisma = prisma;

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl());
}
