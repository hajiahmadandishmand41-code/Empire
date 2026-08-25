#!/usr/bin/env node

/** Final host-agnostic release gate. It never prints secret values. */
import { spawnSync } from 'node:child_process';

const checks = [
  ['host readiness', 'npm', ['run', 'host:check']],
  ['lint', 'npm', ['run', 'lint']],
  ['typecheck', 'npm', ['run', 'typecheck']],
  ['tests', 'npm', ['run', 'test']],
  ['production audit', 'npm', ['run', 'audit:prod']],
  ['release check', 'npm', ['run', 'release-check']],
];

for (const [label, command, args] of checks) {
  console.log(`\n[release-gate] ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\n[release-gate] FAILED: ${label}`);
    process.exit(result.status || 1);
  }
}

console.log('\n[release-gate] PASS: code-quality and release prerequisites are green.');
