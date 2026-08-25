#!/usr/bin/env node

/** Production verification gate.
 * Safe in CI: it validates the runtime contract and code health without
 * mutating application data. Never pass secrets as CLI arguments.
 */
import { spawnSync } from 'node:child_process';

const REQUIRED = ['DATABASE_URL', 'AUTH_SECRET', 'NEXT_PUBLIC_SITE_URL'];
const production = process.env.NODE_ENV === 'production';
const strict = process.env.STRICT_PRODUCTION_CHECK === 'true';

function fail(message) {
  console.error(`\n[production-check] FAIL: ${message}`);
  process.exitCode = 1;
}

for (const name of REQUIRED) {
  if (!process.env[name]?.trim()) fail(`${name} is not configured`);
}

if (production && /^(dev|test|ci)[-_]/i.test(process.env.AUTH_SECRET ?? '')) {
  fail('AUTH_SECRET looks like a non-production test secret');
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
if (siteUrl) {
  try {
    const parsed = new URL(siteUrl);
    if (production && parsed.protocol !== 'https:') fail('NEXT_PUBLIC_SITE_URL must use HTTPS in production');
  } catch {
    fail('NEXT_PUBLIC_SITE_URL is not a valid URL');
  }
}

if (strict && process.env.ALLOW_MOCK_AUTH === 'true') fail('ALLOW_MOCK_AUTH must be disabled in strict mode');

const commands = [
  ['Prisma validate', 'npx', ['prisma', 'validate']],
  ['TypeScript', 'npx', ['tsc', '--noEmit']],
  ['Tests', 'npm', ['run', 'test']],
];

for (const [label, command, args] of commands) {
  console.log(`\n[production-check] ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) fail(`${label} failed`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log('\n[production-check] PASS');
