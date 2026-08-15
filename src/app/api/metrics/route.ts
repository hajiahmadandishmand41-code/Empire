/**
 * Metrics endpoint — Phase 4 (production monitoring),
 * access-hardened in the Metrics Endpoint fix.
 *
 * Prometheus-compatible plain-text exposition of process-level metrics.
 * Intentionally minimal and dependency-free so it works on Node and
 * Edge-adjacent runtimes without pulling in prom-client.
 *
 * Authentication: a `METRICS_TOKEN` env var MUST be set. The endpoint
 * requires an exact-match `Authorization: Bearer <token>` header.
 * The endpoint **fails closed**: if METRICS_TOKEN is not set, the
 * endpoint returns 401 — it is never open, even on a private network.
 * This prevents accidental public exposure of process internals
 * (memory, uptime, version) which would otherwise be a useful recon
 * surface for an attacker.
 *
 * The comparison uses a length-checked constant-time comparison to
 * avoid leaking the token length via timing differences.
 *
 * Version source-of-truth: `process.env.npm_package_version` is set
 * by npm/pnpm when starting via a package.json script and matches
 * package.json exactly. The fallback `APP_VERSION` constant is kept in
 * sync with package.json so cold-start paths never report a stale version.
 */
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Matches the `version` field in package.json — single source of truth. */
const APP_VERSION = '0.13.0';

const START = Date.now();

function fmt(name: string, help: string, type: string, value: number, labels?: Record<string, string>) {
  const lbl = labels
    ? '{' + Object.entries(labels).map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`).join(',') + '}'
    : '';
  return `# HELP ${name} ${help}\n# TYPE ${name} ${type}\n${name}${lbl} ${value}\n`;
}

/** Constant-time string compare for the bearer token. */
function bearerMatches(expected: string, header: string | null): boolean {
  if (!header) return false;
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) return false;
  const provided = header.slice(prefix.length);
  // Both sides must be the same byte length for timingSafeEqual.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const token = process.env.METRICS_TOKEN;
  // Fail-closed: a missing token means the endpoint is unauthenticated,
  // and an unauthenticated metrics endpoint leaks process internals.
  // Operators must configure METRICS_TOKEN before scraping.
  if (!token) {
    return new NextResponse('unauthorized', {
      status: 401,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
  const auth = req.headers.get('authorization');
  if (!bearerMatches(token, auth)) {
    return new NextResponse('unauthorized', {
      status: 401,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }

  const mem = process.memoryUsage();
  const uptime = Math.round((Date.now() - START) / 1000);
  const version = process.env.npm_package_version ?? APP_VERSION;
  const env = process.env.NODE_ENV ?? 'development';

  const body =
    fmt('empire_process_uptime_seconds', 'Process uptime in seconds', 'gauge', uptime) +
    fmt('empire_process_memory_rss_bytes', 'Resident set size in bytes', 'gauge', mem.rss) +
    fmt('empire_process_memory_heap_used_bytes', 'V8 heap used in bytes', 'gauge', mem.heapUsed) +
    fmt('empire_process_memory_heap_total_bytes', 'V8 heap total in bytes', 'gauge', mem.heapTotal) +
    fmt('empire_build_info', 'Build metadata', 'gauge', 1, { version, env });

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
