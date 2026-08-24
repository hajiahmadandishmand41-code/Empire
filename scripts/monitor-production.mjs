#!/usr/bin/env node

/** Scheduled, read-only production monitor. */
const base = (process.env.PRODUCTION_URL || process.env.E2E_BASE_URL || '').replace(/\/$/, '');
if (!base) {
  console.error('Set PRODUCTION_URL.');
  process.exit(1);
}

const paths = ['/api/health', '/api/healthz', '/api/products?limit=1'];
const timeout = Number(process.env.MONITOR_TIMEOUT_MS || 10000);
const results = [];

for (const path of paths) {
  const started = performance.now();
  try {
    const response = await fetch(`${base}${path}`, {
      cache: 'no-store',
      redirect: 'manual',
      headers: { accept: 'application/json', 'x-production-monitor': 'true' },
      signal: AbortSignal.timeout(timeout),
    });
    results.push({ path, ok: response.ok, status: response.status, latencyMs: Math.round(performance.now() - started) });
  } catch (error) {
    results.push({ path, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

console.log(JSON.stringify({ timestamp: new Date().toISOString(), target: base, checks: results }, null, 2));
if (results.some((item) => !item.ok)) process.exit(2);
