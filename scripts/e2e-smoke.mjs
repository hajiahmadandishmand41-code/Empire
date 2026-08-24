#!/usr/bin/env node

/** Read-only production E2E/API smoke suite. */
const base = (process.env.E2E_BASE_URL || process.env.PRODUCTION_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 10000);
const checks = [
  ['/api/health', 200],
  ['/api/healthz', 200],
  ['/api/products?limit=1', 200],
  ['/fa/shop', 200],
];
let failed = 0;

for (const [path, expected] of checks) {
  const started = performance.now();
  try {
    const response = await fetch(`${base}${path}`, {
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: 'application/json,text/html;q=0.9,*/*;q=0.8', 'x-production-smoke': 'true' },
    });
    const elapsed = Math.round(performance.now() - started);
    console.log(`${response.status === expected ? 'PASS' : 'FAIL'} ${response.status} ${elapsed}ms ${path}`);
    if (response.status !== expected) failed++;
  } catch (error) {
    failed++;
    console.error(`FAIL ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) {
  console.error(`\nE2E smoke failed: ${failed} check(s).`);
  process.exit(1);
}
console.log(`\nE2E smoke passed: ${checks.length} checks against ${base}`);
