#!/usr/bin/env node
/**
 * Vercel build orchestrator.
 *
 * Prisma Client must be generated before any Prisma CLI/script invocation
 * because Vercel may restore cached node_modules without regenerating it.
 *
 * Preview/local builds never mutate a database. Production Vercel builds
 * apply forward-only Prisma migrations before compiling the app.
 *
 * Role provisioning is intentionally opt-in through
 * EMPIRE_PROVISION_ROLES_ON_DEPLOY=true so normal deployments cannot
 * unexpectedly reset privileged-account passwords.
 */
import { spawnSync } from 'node:child_process';

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

const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';

// Required before db:deploy and db:provision-roles. This prevents Prisma's
// Vercel dependency-cache initialization error.
run('npx', ['prisma', 'generate'], 'Generating Prisma Client');

if (isVercelProduction) {
  run('npm', ['run', 'db:deploy'], 'Applying Prisma migrations');

  if (process.env.EMPIRE_PROVISION_ROLES_ON_DEPLOY === 'true') {
    run('npm', ['run', 'db:provision-roles'], 'Provisioning production roles');
  }
} else {
  console.log('[vercel-build] Non-production build — database mutations are not run.');
}

run('npm', ['run', 'build'], 'Building Next.js application');
