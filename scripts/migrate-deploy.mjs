#!/usr/bin/env node
/**
 * Safe production migration runner.
 *
 * Rules:
 *  - ONLY ever runs `prisma migrate deploy` (forward-only).
 *  - NEVER runs `migrate reset`, `db push --force-reset`, or any destructive command.
 *  - Prefers a direct (non-pooled) connection for migrations, because
 *    PgBouncer/Neon pooled endpoints are not the right target for reliable DDL.
 *  - If the direct environment variable is unavailable but DATABASE_URL is a
 *    Neon pooled URL, derive the corresponding direct endpoint by removing
 *    Neon’s `-pooler` suffix. This keeps migrations deterministic when Vercel
 *    has only the standard pooled DATABASE_URL configured.
 *  - Soft-fails when no database URL is configured (e.g. preview builds
 *    without a database) so the build itself is never blocked.
 */
import { spawnSync } from 'node:child_process';

const DIRECT_KEYS = [
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
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

function directNeonUrlFromPooledUrl(value) {
  try {
    const url = new URL(value);
    if (!url.hostname.includes('-pooler.')) return null;

    url.hostname = url.hostname.replace('-pooler.', '.');
    return url.toString();
  } catch {
    return null;
  }
}

function pickUrl() {
  const direct = pickConfiguredUrl(DIRECT_KEYS);
  if (direct) return direct;

  const runtime = pickConfiguredUrl(RUNTIME_KEYS);
  if (!runtime) return null;

  const derivedDirect = directNeonUrlFromPooledUrl(runtime.value);
  if (derivedDirect) {
    return { key: `${runtime.key} (derived direct Neon endpoint)`, value: derivedDirect };
  }

  return runtime;
}

function main() {
  if (process.env.SKIP_DB_MIGRATE === '1') {
    console.log('[migrate] SKIP_DB_MIGRATE=1 — skipping migrations.');
    return;
  }

  const picked = pickUrl();
  if (!picked) {
    console.log('[migrate] No database URL configured — skipping `prisma migrate deploy`.');
    return;
  }

  const pooled = /pgbouncer=true|-pooler\./.test(picked.value);
  if (pooled) {
    console.error(
      '[migrate] Refusing to run migrations against a pooled connection. ' +
        'Configure DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING, DIRECT_DATABASE_URL, or DIRECT_URL.',
    );
    process.exit(1);
  }

  console.log(`[migrate] Running \`prisma migrate deploy\` using ${picked.key}.`);
  const result = spawnSync('npx', ['--no-install', 'prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: picked.value },
  });

  if (result.status !== 0) {
    console.error('[migrate] `prisma migrate deploy` failed. No data was modified destructively.');
    process.exit(result.status ?? 1);
  }
  console.log('[migrate] Migrations applied successfully.');
}

main();
