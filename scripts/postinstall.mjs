#!/usr/bin/env node
/**
 * Post-install hook — Phase 12.1 (Termux / mobile Linux).
 *
 * Why this exists
 * ---------------
 * 1. `prisma generate` downloads a native engine binary that matches the
 *    current platform. On Termux (aarch64-linux-android) the default
 *    target list does not always include a working engine, so the
 *    postinstall step used to fail and the whole `npm install` aborted.
 *
 * 2. On slow / metered mobile networks the engine download can also
 *    time out. We treat both cases as soft failures: the JS deps stay
 *    installed, the user sees a clear warning, and they can rerun
 *    `npm run db:generate` when they're ready.
 *
 * 3. On normal Linux/macOS dev boxes this script just delegates to
 *    `prisma generate` and the install completes in the same way as
 *    before.
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform, arch } from 'node:os';

const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';

function isTermux() {
  return Boolean(process.env.PREFIX?.includes('com.termux')) ||
    existsSync('/data/data/com.termux');
}

function detectTarget() {
  if (platform === 'android') {
    return arch === 'arm64' || arch === 'aarch64'
      ? 'linux-arm64-openssl-1.1.x'
      : 'linux-arm-openssl-1.1.x';
  }
  return `native (${platform}/${arch})`;
}

function log(level, msg) {
  const color = level === 'warn' ? YELLOW : level === 'error' ? RED : GREEN;
  console.log(`${color}[postinstall]${RESET} ${msg}`);
}

function runPrismaGenerate() {
  log('info', `running \`prisma generate\` (target: ${detectTarget()}${isTermux() ? ' · Termux' : ''})`);
  const result = spawnSync('npx', ['--no-install', 'prisma', 'generate'], {
    stdio: 'inherit',
    env: process.env,
  });
  return result.status === 0;
}

function main() {
  // If prisma is not yet on disk (very fresh install), try to use the
  // locally-resolved CLI via npx — which falls back to the registry.
  const ok = runPrismaGenerate();
  if (ok) {
    log('info', `${GREEN}Prisma client generated successfully.${RESET}`);
    return;
  }

  log('warn', `${YELLOW}prisma generate failed.${RESET}`);
  log('warn', `This is non-fatal: the rest of the install completed.`);
  log('warn', `Common causes:`);
  log('warn', `  - the engine download was blocked or timed out`);
  log('warn', `  - you are on a platform without a published Prisma engine`);
  log('warn', `  - prisma wants a DATABASE_URL for \`prisma migrate\` (we don't, but the`);
  log('warn', `    generator can be picky about the schema's environment lookup)`);
  log('warn', `Next steps:`);
  log('warn', `  - re-run \`npm run db:generate\` once you're online`);
  log('warn', `  - or set DATABASE_URL=postgresql://x:y@localhost:5432/z npm run db:generate`);
  if (isTermux()) {
    log('warn', `  - Termux: ensure \`openssl\` is installed (\`pkg install openssl-tool\`)`);
    log('warn', `    and use the binaryTargets declared in prisma/schema.prisma.`);
  }
  log('warn', `Continuing regardless — the app will still boot in mock mode.`);
}

main();
