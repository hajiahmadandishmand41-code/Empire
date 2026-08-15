#!/usr/bin/env node
/**
 * Safe production migration runner.
 *
 * Rules:
 *  - ONLY ever runs `prisma migrate deploy` (forward-only).
 *  - NEVER runs `migrate reset`, `db push --force-reset`, or any destructive command.
 *  - Prefers a direct (non-pooled) connection for migrations, because
 *    PgBouncer/Neon pooled endpoints break advisory locks and DDL.
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

function pickUrl() {
  for (const key of DIRECT_KEYS) {
    const value = process.env[key];
    if (value && value.trim()) return { key, value: value.trim() };
  }
  for (const key of ['DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL']) {
    const value = process.env[key];
    if (value && value.trim()) return { key, value: value.trim() };
  }
  return null;
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
  if (pooled && !DIRECT_KEYS.some((k) => k === picked.key)) {
    console.warn(
      '[migrate] WARNING: using a pooled connection for migrations. ' +
        'Set DATABASE_URL_UNPOOLED or POSTGRES_URL_NON_POOLING for reliable DDL.',
    );
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
