#!/usr/bin/env node
/**
 * Vercel build orchestrator.
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

const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';

run('npx', ['prisma', 'generate'], 'Generating Prisma Client');

if (isVercelProduction) {
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET ?? '';
  if (authSecret.trim().length < 32) {
    console.error('[vercel-build] AUTH_SECRET/NEXTAUTH_SECRET/SESSION_SECRET must be at least 32 characters in production.');
    console.error('[vercel-build] Refusing to run production database migrations or role provisioning.');
    process.exit(1);
  }

  run('npm', ['run', 'db:deploy'], 'Applying Prisma migrations');

  if (process.env.EMPIRE_PROVISION_ROLES_ON_DEPLOY === 'true') {
    run('npm', ['run', 'db:provision-roles'], 'Provisioning production roles');
  }
} else {
  console.log('[vercel-build] Non-production build — database mutations are not run.');
}

run('npm', ['run', 'build'], 'Building Next.js application');
