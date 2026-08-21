#!/usr/bin/env node
/**
 * Vercel build orchestrator.
 *
 * Production database handling is deliberately split into three safe states:
 *  - Existing migration history: run migrate deploy.
 *  - Existing application schema with no migration history: bootstrap the
 *    canonical baseline, then run migrate deploy.
 *  - Empty database: skip baseline and let migrate deploy create the schema.
 *
 * A partially-populated database without migration history is still rejected by
 * the baseline script to avoid guessing what schema state it is in.
 */
import { spawnSync } from 'node:child_process';

process.env.PRISMA_HIDE_UPDATE_MESSAGE = '1';

function run(command, args, label) {
  console.log(`[vercel-build] ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`[vercel-build] Failed to start ${label}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[vercel-build] ${label} failed; refusing to continue.`);
    process.exit(result.status ?? 1);
  }
}

function runBaseline() {
  console.log('[vercel-build] Bootstrapping Prisma migration history');
  const result = spawnSync('node', ['scripts/baseline-prisma-migrations.mjs'], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`[vercel-build] Failed to start Prisma baseline: ${result.error.message}`);
    process.exit(1);
  }

  // Exit code 10 means the database is genuinely empty. In that case there is
  // no historical schema to baseline; migrate deploy must create it normally.
  if (result.status === 10) {
    console.log('[vercel-build] Database is empty — skipping historical baseline and applying migrations normally.');
    return;
  }

  if (result.status !== 0) {
    console.error('[vercel-build] Prisma migration-history bootstrap failed; refusing to continue.');
    process.exit(result.status ?? 1);
  }
}

const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';

run('npx', ['prisma', 'generate'], 'Generating Prisma Client');

if (isVercelProduction) {
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET ?? '';
  if (authSecret.trim().length < 32) {
    console.error('[vercel-build] AUTH_SECRET/NEXTAUTH_SECRET/SESSION_SECRET must be at least 32 characters in production.');
    console.error('[vercel-build] Refusing to run production database migrations or role provisioning.');
    process.exit(1);
  }

  runBaseline();
  run('npm', ['run', 'db:deploy'], 'Applying Prisma migrations');

  if (process.env.EMPIRE_PROVISION_ROLES_ON_DEPLOY === 'true') {
    run('npm', ['run', 'db:provision-roles'], 'Provisioning production roles');
  }
} else {
  console.log('[vercel-build] Non-production build — database mutations are not run.');
}

run('npm', ['run', 'build'], 'Building Next.js application');
