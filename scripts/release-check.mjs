#!/usr/bin/env node
/**
 * Release readiness checker — Phase 10.
 *
 * Runs a set of static, dependency-free checks that catch the most
 * common production-launch mistakes:
 *
 *  - critical env vars are present (or explicitly optional)
 *  - AUTH_SECRET is not the placeholder value and is long enough
 *  - NEXT_PUBLIC_SITE_URL is set (SEO / sitemap / og:url need it)
 *  - PWA icons + manifest exist
 *  - robots.ts / sitemap.ts exist
 *  - a health endpoint exists
 *  - package.json version has been bumped past 0.1.0
 *
 * Exits 0 on success, 1 on any hard failure. Warnings never fail.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = '\x1b[0m', G = '\x1b[32m', Y = '\x1b[33m', RED = '\x1b[31m', C = '\x1b[36m';

let failures = 0;
let warnings = 0;

const ok = (m) => console.log(`  ${G}✓${R} ${m}`);
const warn = (m) => { warnings++; console.log(`  ${Y}!${R} ${m}`); };
const fail = (m) => { failures++; console.log(`  ${RED}✗${R} ${m}`); };
const head = (m) => console.log(`\n${C}${m}${R}`);

function fileExists(rel) {
  return existsSync(join(ROOT, rel));
}
function mustExist(rel, label = rel) {
  if (fileExists(rel)) ok(`${label} present`);
  else fail(`${label} missing (${rel})`);
}

head('Empire Shop · Phase 10 release check');

head('Environment');
const env = process.env;
const isProd = env.NODE_ENV === 'production';

const sessionSecret = env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? env.SESSION_SECRET;
if (!sessionSecret) {
  (isProd ? fail : warn)('AUTH_SECRET / NEXTAUTH_SECRET / SESSION_SECRET not set');
} else {
  const s = sessionSecret;
  if (/change-?me/i.test(s)) fail('AUTH_SECRET still using placeholder value');
  else if (s.length < 32) warn(`AUTH_SECRET is short (${s.length} chars, recommend >= 32)`);
  else ok('AUTH_SECRET looks strong');
}

if (!env.NEXT_PUBLIC_SITE_URL) warn('NEXT_PUBLIC_SITE_URL not set — sitemap.xml / og:url will be relative');
else ok(`NEXT_PUBLIC_SITE_URL = ${env.NEXT_PUBLIC_SITE_URL}`);

if (isProd) {
  for (const key of ['DATABASE_URL','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','ATOMA_PAY_MERCHANT_ID','ATOMA_PAY_API_KEY','ATOMA_PAY_WEBHOOK_SECRET']) {
    if (!env[key]) fail(`${key} not set in production`);
    else ok(`${key} configured`);
  }
  const cloudinaryKeys = ['CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'];
  const cloudinarySet = cloudinaryKeys.filter((key) => env[key]);
  if (cloudinarySet.length === cloudinaryKeys.length) ok('image storage: Cloudinary');
  else if (cloudinarySet.length === 0) ok('image storage: database (MediaAsset fallback)');
  else fail(`partial Cloudinary configuration — set all of ${cloudinaryKeys.join(', ')} or none`);
  if (env.ALLOW_MOCK_AUTH === 'true' || env.APP_MODE === 'demo') fail('mock/demo mode is forbidden in production');
} else if (!env.DATABASE_URL) warn('DATABASE_URL not set — local/demo execution may be unavailable');
else ok('DATABASE_URL configured');

if (env.ALLOWED_ORIGIN === '*' || env.ALLOWED_ORIGINS === '*') fail('ALLOWED_ORIGIN(S) is "*" — must be an explicit allowlist in production');

head('Files');
mustExist('src/app/robots.ts', 'robots.ts');
mustExist('src/app/sitemap.ts', 'sitemap.ts');
mustExist('src/app/not-found.tsx', 'not-found.tsx');
mustExist('src/app/api/health/route.ts', 'health endpoint');
mustExist('public/manifest.webmanifest', 'PWA manifest');
mustExist('public/sw.js', 'service worker');
mustExist('public/offline.html', 'offline fallback');
mustExist('public/icons/icon-192.png', 'PWA icon 192');
mustExist('public/icons/icon-512.png', 'PWA icon 512');
if (fileExists('src/proxy.ts')) ok('proxy present');
else mustExist('src/middleware.ts', 'middleware');
mustExist('src/lib/security/headers.ts', 'security headers');

head('Phase 4 — production infra');
mustExist('scripts/validate-production-env.mjs', 'production env validator');
mustExist('Dockerfile', 'Dockerfile');
mustExist('docker-compose.yml', 'docker-compose.yml');
mustExist('.dockerignore', '.dockerignore');
mustExist('.github/workflows/ci.yml', 'CI workflow');
mustExist('.github/workflows/deploy.yml', 'Deploy workflow');
mustExist('scripts/backup.sh', 'DB backup script');
mustExist('scripts/restore.sh', 'DB restore script');
mustExist('src/app/api/metrics/route.ts', 'metrics endpoint');
mustExist('vitest.config.ts', 'vitest config');
mustExist('tests/health.test.ts', 'health test');

head('Package');
try {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  ok(`version: ${pkg.version}`);
  if (pkg.version === '0.1.0') warn('package.json version still 0.1.0 — bump before release');
  for (const s of ['build', 'start', 'db:deploy']) {
    if (!pkg.scripts?.[s]) fail(`missing npm script: ${s}`);
  }
  if (pkg.scripts?.build) ok('build script present');
  if (pkg.scripts?.start) ok('start script present');
} catch (e) {
  fail(`could not read package.json: ${e.message}`);
}

head('Summary');
console.log(`  ${failures === 0 ? G + '✓' : RED + '✗'}${R} failures: ${failures}`);
console.log(`  ${warnings === 0 ? G + '✓' : Y + '!'}${R} warnings: ${warnings}`);
process.exit(failures > 0 ? 1 : 0);
