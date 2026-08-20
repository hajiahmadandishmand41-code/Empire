/**
 * Prisma client singleton.
 *
 * Vercel Storage can expose the same PostgreSQL database through different
 * connection-variable names depending on integration/version. Runtime code
 * must use the same database selected for Prisma migrations rather than
 * silently falling back to mocks when DATABASE_URL is absent.
 *
 * Selection order:
 *   1. DATABASE_URL (canonical runtime URL)
 *   2. POSTGRES_PRISMA_URL / POSTGRES_URL (Vercel-compatible aliases)
 *   3. DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING / SUPABASE_DB_URL
 *      (direct-connection compatibility paths)
 *
 * No secret values are logged.
 */
import { PrismaClient } from '@prisma/client';

const DATABASE_URL_KEYS = [
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
  'SUPABASE_DB_URL',
] as const;

function resolveDatabaseUrl(): string | undefined {
  for (const key of DATABASE_URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

// Prisma's datasource is intentionally defined as env("DATABASE_URL").
// Normalize compatible Vercel/Postgres/Supabase aliases into that canonical
// variable before the PrismaClient is instantiated, while preserving an
// explicitly configured DATABASE_URL unchanged.
const resolvedDatabaseUrl = resolveDatabaseUrl();
if (!process.env.DATABASE_URL && resolvedDatabaseUrl) {
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

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl());
}
