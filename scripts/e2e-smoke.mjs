#!/usr/bin/env node

/** Read-only production/preview E2E and API smoke suite. */
const base = (process.env.E2E_BASE_URL || process.env.PRODUCTION_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 10000);
let failed = 0;

async function request(path, accept = 'application/json,text/html;q=0.9,*/*;q=0.8') {
  const started = performance.now();
  const response = await fetch(`${base}${path}`, {
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { accept, 'x-production-smoke': 'true' },
  });
  return { response, elapsed: Math.round(performance.now() - started) };
}

async function check(path, expected = 200) {
  try {
    const { response, elapsed } = await request(path);
    const ok = response.status === expected;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${elapsed}ms ${path}`);
    if (!ok) failed++;
    return ok ? response : null;
  } catch (error) {
    failed++;
    console.error(`FAIL ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

await check('/api/health', 200);
await check('/api/healthz', 200);

try {
  const { response, elapsed } = await request('/api/health/deep');
  const payload = await response.json().catch(() => null);
  const ok = response.status === 200
    && payload?.application === 'ok'
    && payload?.database === 'ok'
    && payload?.auth === 'ok'
    && payload?.storage === 'ok';
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${elapsed}ms /api/health/deep ${ok ? '(db+auth+storage ok)' : '(deep readiness failed)'}`);
  if (!ok) failed++;
} catch (error) {
  failed++;
  console.error(`FAIL /api/health/deep: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const { response, elapsed } = await request('/api/products?limit=1&locale=fa');
  const payload = await response.json().catch(() => null);
  const ok = response.status === 200 && Array.isArray(payload?.data) && payload?.meta?.source === 'db';
  console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${elapsed}ms /api/products?limit=1&locale=fa ${ok ? '(database-backed)' : '(unexpected payload)'}`);
  if (!ok) failed++;
} catch (error) {
  failed++;
  console.error(`FAIL /api/products?limit=1&locale=fa: ${error instanceof Error ? error.message : String(error)}`);
}

await check('/fa/shop', 200);
const brandsPage = await check('/fa/brands', 200);

if (brandsPage) {
  try {
    const html = await brandsPage.text();
    const match = html.match(/href=["'](?:\/fa)?\/fa\/brands\/([^"'?#/]+)["']/i)
      ?? html.match(/href=["']\/fa\/brands\/([^"'?#/]+)["']/i);
    if (match?.[1]) {
      await check(`/fa/brands/${encodeURIComponent(match[1])}`, 200);
    } else {
      console.log('PASS /fa/brands detail discovery (no brand exists; index is healthy)');
    }
  } catch (error) {
    failed++;
    console.error(`FAIL /fa/brands detail discovery: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) {
  console.error(`\nE2E smoke failed: ${failed} check(s).`);
  process.exit(1);
}
console.log(`\nE2E smoke passed against ${base}`);
