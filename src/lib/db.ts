/**
 * Prisma client singleton.
 *
 * Vercel/Supabase Marketplace can expose the same PostgreSQL database through
 * several connection-variable names. Prefer the Marketplace-managed pooler
 * URLs over manually-added direct URLs so runtime and migrations target the
 * same database without requiring IPv6 support on Vercel.
 *
 * Selection order:
 *   1. STORAGE_POSTGRES_PRISMA_URL / STORAGE_POSTGRES_URL
 *   2. POSTGRES_PRISMA_URL / POSTGRES_URL
 *   3. DATABASE_URL
 *   4. STORAGE_POSTGRES_URL_NON_POOLING / POSTGRES_URL_NON_POOLING
 *   5. DATABASE_URL_UNPOOLED / SUPABASE_DB_URL
 *
 * No secret values are logged.
 */
import { PrismaClient } from '@prisma/client';

const DATABASE_URL_KEYS = [
  'STORAGE_POSTGRES_PRISMA_URL',
  'STORAGE_POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'DATABASE_URL',
  'STORAGE_POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL_NON_POOLING',
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

// Prisma's datasource is intentionally defined as env("DATABASE_URL").
// Normalize compatible Vercel/Postgres/Supabase aliases into that canonical
// variable before the PrismaClient is instantiated.
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
