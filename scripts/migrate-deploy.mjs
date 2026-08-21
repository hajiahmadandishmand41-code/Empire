#!/usr/bin/env node
/**
 * Safe production migration runner.
 *
 * Rules:
 *  - ONLY ever runs `prisma migrate deploy` (forward-only).
 *  - NEVER runs `migrate reset`, `db push --force-reset`, or any destructive command.
 *  - On IPv4-only platforms such as Vercel, prefer Supabase's session pooler.
 *  - Ignore direct IPv6 Supabase endpoints on Vercel when a pooler URL is available.
 *  - Fall back to the configured direct URL only when no pooler URL is available.
 *  - Add a bounded connection timeout so a cold database gets enough time.
 *  - Never silently skip a migration when a database URL is configured.
 *  - In Vercel production, SKIP_DB_MIGRATE=1 is a hard failure rather than a bypass.
 */
import { spawnSync } from 'node:child_process';

function readEnv(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

function isVercelProduction() {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';
}

function normalizePoolerUrl(value) {
  try {
    const url = new URL(value);
    if (!url.hostname.includes('.pooler.supabase.com')) return null;

    // Supabase session mode is the IPv4-compatible mode suitable for Prisma migrations.
    // If Marketplace supplies a transaction-mode URL on 6543, convert it to session mode.
    if (url.port === '6543') url.port = '5432';
    if (!url.port) url.port = '5432';
    url.searchParams.delete('pgbouncer');
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '30');
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeAnyUrl(value) {
  try {
    const url = new URL(value);
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '30');
    return url.toString();
  } catch {
    throw new Error('Configured database URL is not a valid PostgreSQL URL.');
  }
}

function pickMigrationUrl() {
  // Prefer an actual Supavisor pooler URL from the Vercel/Supabase integration.
  const poolerCandidates = [
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

  // Marketplace may expose a direct IPv6 URL under NON_POOLING. On Vercel,
  // do not choose that URL while a usable pooler is absent unless there is no other option.
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
    console.error(
      '[migrate] No database URL configured. A Supabase session-pooler URL or database URL is required before running production migrations.',
    );
    process.exit(1);
  }

  console.log(`[migrate] Running ` + '`prisma migrate deploy`' + ` using ${picked.key}.`);
  const result = spawnSync('npx', ['--no-install', 'prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: picked.value },
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
