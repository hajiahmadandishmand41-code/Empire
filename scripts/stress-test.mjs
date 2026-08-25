#!/usr/bin/env node

/**
 * Safe HTTP stress harness for staging/local environments.
 *
 * READ mode is the default. Any write-like method requires:
 *   STRESS_WRITE=true
 *   STRESS_TARGET=staging-or-local
 * and refuses public production hosts unless explicitly allowed.
 */
const base = (process.env.STRESS_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const path = process.env.STRESS_PATH || '/api/products?limit=1';
const concurrency = Math.max(1, Math.min(200, Number(process.env.STRESS_CONCURRENCY || 25)));
const requests = Math.max(concurrency, Math.min(5000, Number(process.env.STRESS_REQUESTS || 200)));
const method = (process.env.STRESS_METHOD || 'GET').toUpperCase();
const writeMode = process.env.STRESS_WRITE === 'true';
const allowProduction = process.env.ALLOW_PRODUCTION_STRESS === 'true';
const targetHost = new URL(base).hostname;
const looksProduction = /(^|\.)vercel\.app$|(^|\.)vercel\.sh$|(^|\.)netlify\.app$|(^|\.)herokuapp\.com$/i.test(targetHost);

if (method !== 'GET' && !writeMode) throw new Error('Refusing non-GET stress test: set STRESS_WRITE=true explicitly.');
if (writeMode && !process.env.STRESS_TARGET) throw new Error('Write stress tests require STRESS_TARGET (for example staging).');
if (looksProduction && !allowProduction) throw new Error('Refusing stress testing against a public production host.');

const body = process.env.STRESS_BODY_JSON ? process.env.STRESS_BODY_JSON : undefined;
const headers = {
  accept: 'application/json,text/plain,*/*',
  ...(body ? { 'content-type': 'application/json' } : {}),
  'x-stress-test': 'true',
};
const samples = [];
let completed = 0;
let failed = 0;
let cursor = 0;

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= requests) return;
    const start = performance.now();
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : body,
        cache: 'no-store',
        signal: AbortSignal.timeout(Number(process.env.STRESS_TIMEOUT_MS || 15000)),
      });
      samples.push(performance.now() - start);
      completed++;
      if (!response.ok) failed++;
    } catch {
      failed++;
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
samples.sort((a, b) => a - b);
const percentile = (p) => samples[Math.min(samples.length - 1, Math.floor(samples.length * p))] ?? 0;
const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;

console.log(JSON.stringify({
  target: base,
  path,
  method,
  requests,
  concurrency,
  completed,
  failed,
  successRate: requests ? Number(((completed - failed) / requests).toFixed(4)) : 0,
  latencyMs: {
    p50: Number(percentile(0.50).toFixed(1)),
    p95: Number(percentile(0.95).toFixed(1)),
    p99: Number(percentile(0.99).toFixed(1)),
    avg: Number(avg.toFixed(1)),
  },
}, null, 2));

if (failed > 0) process.exit(2);
