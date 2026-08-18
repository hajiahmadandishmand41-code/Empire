#!/usr/bin/env node
/**
 * Vercel build orchestrator.
 *
 * Preview/local builds never mutate a database. Production Vercel builds
 * apply forward-only Prisma migrations before compiling the app.
 *
 * Role provisioning is intentionally opt-in through
 * EMPIRE_PROVISION_ROLES_ON_DEPLOY=true so normal deployments cannot
 * unexpectedly reset privileged-account passwords.
 */
import { spawnSync } from 'node:child_process';

const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production';

if (isVercelProduction) {
  console.log('[vercel-build] Production deployment detected — applying Prisma migrations first.');
  const migration = spawnSync('npm', ['run', 'db:deploy'], {
    stdio: 'inherit',
    env: process.env,
  });

  if (migration.error) {
    console.error(`[vercel-build] Failed to start migrations: ${migration.error.message}`);
    process.exit(1);
  }
  if (migration.status !== 0) {
    console.error('[vercel-build] Prisma migrations failed; refusing to continue the production build.');
    process.exit(migration.status ?? 1);
  }

  if (process.env.EMPIRE_PROVISION_ROLES_ON_DEPLOY === 'true') {
    console.log('[vercel-build] Role provisioning enabled for this deployment.');
    const provisioning = spawnSync('npm', ['run', 'db:provision-roles'], {
      stdio: 'inherit',
      env: process.env,
    });

    if (provisioning.error) {
      console.error(`[vercel-build] Failed to start role provisioning: ${provisioning.error.message}`);
      process.exit(1);
    }
    if (provisioning.status !== 0) {
      console.error('[vercel-build] Role provisioning failed; refusing to continue the production build.');
      process.exit(provisioning.status ?? 1);
    }
  }
} else {
  console.log('[vercel-build] Non-production build — database migrations are not run.');
}

const build = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: process.env,
});

if (build.error) {
  console.error(`[vercel-build] Failed to start app build: ${build.error.message}`);
  process.exit(1);
}

process.exit(build.status ?? 1);
