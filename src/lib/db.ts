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
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '2');
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '20');
    return url.toString();
  } catch {
    return raw;
  }
}

// Prisma's datasource is intentionally defined as env("DATABASE_URL").
// Normalize the preferred Marketplace-managed URL into the canonical variable
// and apply conservative serverless pool defaults when they are absent.
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
