#!/usr/bin/env node
/**
 * Environment sanity check — Phase 12.1.
 *
 * Run before `npm install` (or when it fails) to diagnose common
 * Termux / mobile / low-RAM issues. Always exits 0 — the goal is to
 * print guidance, not to block installs.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform, arch, totalmem, freemem, cpus } from 'node:os';
import { createHash } from 'node:crypto';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';

function line(s = '') { console.log(s); }
function ok(msg)    { line(`  ${GREEN}✓${RESET} ${msg}`); }
function warn(msg)  { line(`  ${YELLOW}!${RESET} ${msg}`); }
function bad(msg)   { line(`  ${RED}✗${RESET} ${msg}`); }
function info(msg)  { line(`  ${CYAN}i${RESET} ${msg}`); }
function head(msg)  { line(`\n${CYAN}${msg}${RESET}`); }

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch { return ''; }
}

function isTermux() {
  return Boolean(process.env.PREFIX?.includes('com.termux')) ||
    existsSync('/data/data/com.termux');
}

head('Empire Shop · environment check');

line(`  node     : ${process.version}`);
line(`  platform : ${platform} ${arch}`);
line(`  cpus     : ${cpus().length}`);
line(`  ram      : ${(totalmem() / 1024 ** 3).toFixed(1)} GB total, ${(freemem() / 1024 ** 3).toFixed(1)} GB free`);
line(`  termux?  : ${isTermux() ? 'yes' : 'no'}`);

head('Required tools');
const tools = [
  { name: 'git',    why: 'for version control + patch installs' },
  { name: 'python3', why: 'needed by node-gyp fallbacks' },
  { name: 'make',   why: 'needed by node-gyp' },
  { name: 'g++',    why: 'needed by node-gyp (bcryptjs, sharp, etc.)' },
];
for (const t of tools) {
  const has = sh(`command -v ${t.name}`);
  if (has) ok(`${t.name} found: ${has}`);
  else warn(`${t.name} NOT found — ${t.why}`);
}

head('Termux-specific');
if (isTermux()) {
  const openssl = sh('command -v openssl');
  if (openssl) ok(`openssl: ${openssl}`);
  else warn(`openssl missing — run \`pkg install openssl-tool\` for Prisma engines`);

  const proot = sh('command -v proot');
  if (proot) ok(`proot: ${proot} (optional, for distros)`);
  else info('proot not installed (optional)');

  const java = sh('command -v java');
  if (java) ok(`java: ${java}`);
  else info('java not installed (only needed if you want to run psql/Mongo locally)');
}

head('Node version');
const major = parseInt(process.versions.node.split('.')[0], 10);
if (major >= 18) ok(`node ${process.versions.node} >= 18.18 required by package.json`);
else bad(`node ${process.versions.node} is too old; upgrade to >=18.18 (Termux: \`pkg upgrade nodejs\`)`);

head('Disk space');
try {
  const df = sh('df -k .').split('\n')[1]?.split(/\s+/);
  if (df && df.length >= 4) {
    const freeGB = parseInt(df[3], 10) / 1024 / 1024;
    if (freeGB > 1.5) ok(`${freeGB.toFixed(1)} GB free (need ~1 GB for node_modules)`);
    else warn(`only ${freeGB.toFixed(2)} GB free — install may fail`);
  }
} catch { /* df not available on Windows */ }

head('Common pitfalls');
info('If `npm install` fails on Prisma, run:');
info('  DATABASE_URL=postgresql://x:y@localhost:5432/z npm run db:generate');
info('If bcryptjs fails to compile, run:');
info('  npm install bcryptjs --build-from-source (Termux: ensure python + make)');
info('If Next.js dev server is slow, use `npm run build && npm start` instead.');

line();
