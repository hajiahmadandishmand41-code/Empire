#!/usr/bin/env node
/**
 * Safe production migration runner.
 *
 * Forward-only by default. The only recovery exception is the known demo
 * catalog migration below: if it failed before completing, mark that exact
 * migration rolled back so Prisma can retry the corrected SQL on the next
 * deploy. No reset/db-push/destructive recovery is ever performed.
 */
import { spawnSync } from 'node:child_process';

const RECOVERABLE_MIGRATION = '20260821190000_admin_catalog_seed';

function readEnv(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}
function isVercelProduction() { return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'; }
function normalizePoolerUrl(value) {
  try {
    const url = new URL(value);
    if (!url.hostname.includes('.pooler.supabase.com')) return null;
    if (url.port === '6543') url.port = '5432';
    if (!url.port) url.port = '5432';
    url.searchParams.delete('pgbouncer');
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '30');
    return url.toString();
  } catch { return null; }
}
function normalizeAnyUrl(value) {
  try {
    const url = new URL(value);
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '30');
    return url.toString();
  } catch { throw new Error('Configured database URL is not a valid PostgreSQL URL.'); }
}
function pickMigrationUrl() {
  const poolerCandidates = [
    ['STORAGE_POSTGRES_URL_NON_POOLING', readEnv('STORAGE_POSTGRES_URL_NON_POOLING')],
    ['STORAGE_POSTGRES_PRISMA_URL', readEnv('STORAGE_POSTGRES_PRISMA_URL')],
    ['STORAGE_POSTGRES_URL', readEnv('STORAGE_POSTGRES_URL')],
    ['POSTGRES_URL_NON_POOLING', readEnv('POSTGRES_URL_NON_POOLING')],
    ['POSTGRES_PRISMA_URL', readEnv('POSTGRES_PRISMA_URL')],
    ['POSTGRES_URL', readEnv('POSTGRES_URL')],
    ['SUPABASE_DB_URL', readEnv('SUPABASE_DB_URL')],
  ];
  for (const [key, value] of poolerCandidates) {
    if (!value) continue;
    const normalized = normalizePoolerUrl(value);
    if (normalized) return { key, value: normalized };
  }
  const directCandidates = [
    ['DATABASE_URL_UNPOOLED', readEnv('DATABASE_URL_UNPOOLED')],
    ['DIRECT_DATABASE_URL', readEnv('DIRECT_DATABASE_URL')],
    ['DIRECT_URL', readEnv('DIRECT_URL')],
    ['DATABASE_URL', readEnv('DATABASE_URL')],
  ];
  for (const [key, value] of directCandidates) {
    if (value) return { key, value: normalizeAnyUrl(value) };
  }
  return null;
}
function runPrisma(args, databaseUrl) {
  return spawnSync('npx', ['--no-install', 'prisma', ...args], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}
function recoverKnownFailedMigration(databaseUrl) {
  const result = runPrisma(['migrate', 'resolve', '--rolled-back', RECOVERABLE_MIGRATION], databaseUrl);
  if (result.error) throw new Error(`Failed to start Prisma migration recovery: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Known migration recovery failed for ${RECOVERABLE_MIGRATION}.`);
}
function main() {
  if (process.env.SKIP_DB_MIGRATE === '1') {
    if (isVercelProduction()) {
      console.error('[migrate] SKIP_DB_MIGRATE=1 is forbidden for Vercel production deployments.');
      process.exit(1);
    }
    console.log('[migrate] SKIP_DB_MIGRATE=1 — skipping migrations outside Vercel production.');
    return;
  }
  const picked = pickMigrationUrl();
  if (!picked) {
    console.error('[migrate] No database URL configured.');
    process.exit(1);
  }
  console.log(`[migrate] Using ${picked.key}.`);
  const initial = runPrisma(['migrate', 'deploy'], picked.value);
  if (!initial.error && initial.status === 0) {
    console.log('[migrate] Migrations applied successfully.');
    return;
  }

  // Only attempt recovery when Prisma reports a failed migration state. The
  // recovery command targets one known, non-destructive demo migration.
  console.warn(`[migrate] Initial migrate deploy failed with status ${initial.status ?? 1}; attempting targeted recovery for ${RECOVERABLE_MIGRATION}.`);
  recoverKnownFailedMigration(picked.value);

  const retry = runPrisma(['migrate', 'deploy'], picked.value);
  if (retry.error) {
    console.error(`[migrate] Failed to start Prisma retry: ${retry.error.message}`);
    process.exit(1);
  }
  if (retry.status !== 0) {
    console.error('[migrate] `prisma migrate deploy` failed after targeted recovery.');
    process.exit(retry.status ?? 1);
  }
  console.log('[migrate] Migrations applied successfully after targeted recovery.');
}
main();
