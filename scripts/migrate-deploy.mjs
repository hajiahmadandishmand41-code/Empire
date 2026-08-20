#!/usr/bin/env node
/**
 * Safe production migration runner.
 *
 * Rules:
 *  - ONLY ever runs `prisma migrate deploy` (forward-only).
 *  - NEVER runs `migrate reset`, `db push --force-reset`, or any destructive command.
 *  - Prefer the explicitly configured direct/non-pooled URL for migrations.
 *  - If a direct URL is not configured, use the configured DATABASE_URL as-is.
 *  - Add a bounded connection timeout so a cold database gets enough time.
 *  - Never silently skip a migration when a database URL is configured.
 *  - In Vercel production, SKIP_DB_MIGRATE=1 is a hard failure rather than a bypass.
 */
import { spawnSync } from 'node:child_process';

// Supabase/Vercel can expose the direct database URL under different names
// depending on integration/version. Keep all known safe aliases here.
const DIRECT_KEYS = [
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
  'SUPABASE_DB_URL',
  'DIRECT_DATABASE_URL',
  'DIRECT_URL',
];

const RUNTIME_KEYS = [
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
];

function pickConfiguredUrl(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return { key, value: value.trim() };
  }
  return null;
}

function withConnectTimeout(value) {
  try {
    const url = new URL(value);
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '30');
    }
    return url.toString();
  } catch {
    throw new Error('Configured database URL is not a valid PostgreSQL URL.');
  }
}

function pickUrl() {
  return pickConfiguredUrl(DIRECT_KEYS) ?? pickConfiguredUrl(RUNTIME_KEYS);
}

function isVercelProduction() {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';
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

  const picked = pickUrl();
  if (!picked) {
    console.error(
      '[migrate] No database URL configured. Set DATABASE_URL_UNPOOLED (preferred), POSTGRES_URL_NON_POOLING, SUPABASE_DB_URL, or DATABASE_URL before running production migrations.',
    );
    process.exit(1);
  }

  const databaseUrl = withConnectTimeout(picked.value);

  console.log(`[migrate] Running \`prisma migrate deploy\` using ${picked.key}.`);
  const result = spawnSync('npx', ['--no-install', 'prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  if (result.error) {
    console.error(`[migrate] Failed to start Prisma: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error('[migrate] `prisma migrate deploy` failed. No destructive migration command was executed.');
    process.exit(result.status ?? 1);
  }

  console.log('[migrate] Migrations applied successfully.');
}

main();
