#!/usr/bin/env node
/**
 * Vercel build orchestrator.
 *
 * Preview/local builds never mutate a database. Production Vercel builds
 * apply forward-only Prisma migrations, then provision the optional
 * production Admin/Seller accounts from server-only environment variables,
 * before compiling the app.
 */
import { spawnSync } from 'node:child_process';

const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });

  if (result.error) {
    console.error(`[vercel-build] Failed to start ${label}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[vercel-build] ${label} failed; refusing to continue the production build.`);
    process.exit(result.status ?? 1);
  }
}

if (isVercelProduction) {
  console.log('[vercel-build] Production deployment detected — applying Prisma migrations first.');
  run('npm', ['run', 'db:deploy'], 'Prisma migrations');

  const hasRoleProvisioningEnv = [
    'EMPIRE_ADMIN_EMAIL',
    'EMPIRE_ADMIN_PASSWORD',
    'EMPIRE_SELLER_EMAIL',
    'EMPIRE_SELLER_PASSWORD',
  ].every((name) => Boolean(process.env[name]?.trim()));

  if (hasRoleProvisioningEnv) {
    console.log('[vercel-build] Provisioning production Admin/Seller accounts.');
    run('npx', ['prisma', 'generate'], 'Prisma client generation for role provisioning');
    run('npm', ['run', 'db:provision-roles'], 'role provisioning');
  } else {
    console.log('[vercel-build] Role provisioning skipped — required EMPIRE_* credentials are not configured.');
  }
} else {
  console.log('[vercel-build] Non-production build — database mutations are not run.');
}

run('npm', ['run', 'build'], 'application build');
