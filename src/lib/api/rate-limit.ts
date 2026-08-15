/**
 * Sliding-window rate limiter — Phase 8, hardened in Phase 10.4,
 * security-tightened for production in the Rate Limiter fix.
 *
 * Two backends behind a single `rateLimit()` API:
 *
 *   1. **Upstash Redis REST** (required for multi-instance production).
 *      Enabled automatically when both `UPSTASH_REDIS_REST_URL` and
 *      `UPSTASH_REDIS_REST_TOKEN` are set. Uses `INCR` + `PEXPIRE` so all
 *      instances share the same window.
 *
 *      Failure mode is **fail-closed**: if Redis is configured but
 *      unreachable (network error, timeout, non-2xx, malformed reply),
 *      `rateLimitAsync()` refuses the request (`ok: false`) instead of
 *      silently degrading to a per-instance in-memory bucket. The reason
 *      is that an in-memory fallback in a multi-instance deployment
 *      effectively multiplies the configured limit by N (the number of
 *      instances) — an attacker can simply spread load across instances
 *      to bypass the limit. Fail-closed preserves the security posture
 *      at the cost of availability during a Redis outage; operators
 *      must restore Redis to recover. The incident is logged so it is
 *      visible to monitoring.
 *
 *   2. **In-memory** (single-instance / dev). Only used by `rateLimit()`
 *      and by `rateLimitAsync()` when Redis is NOT configured. Suitable
 *      for one Node.js / Edge instance only.
 *
 * Presets and helpers stay stable so callers don't change.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export const RATE_PRESETS = {
  auth: { limit: 10, windowMs: 60_000 },
  write: { limit: 30, windowMs: 60_000 },
  read: { limit: 120, windowMs: 60_000 },
  payments: { limit: 20, windowMs: 60_000 },
} as const;

function gc(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
    if (buckets.size < MAX_BUCKETS / 2) break;
  }
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  gc(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: limit - 1, resetAt };
  }
  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return { ok: bucket.count <= limit, limit, remaining, resetAt: bucket.resetAt };
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

async function redisPipeline(commands: (string | number)[][]): Promise<unknown[] | null> {
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      // Keep the limiter cheap — never let a slow Redis pin an API request.
      signal: AbortSignal.timeout(250),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result: unknown }[] | unknown[];
    return Array.isArray(data) ? (data as unknown[]) : null;
  } catch {
    return null;
  }
}

async function redisLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const now = Date.now();
  // Bucketed window key — one slot per windowMs so INCR resets naturally.
  const slot = Math.floor(now / windowMs);
  const redisKey = `rl:${key}:${slot}`;
  const result = await redisPipeline([
    ['INCR', redisKey],
    ['PEXPIRE', redisKey, windowMs],
  ]);
  if (!result || result.length === 0) return null;
  const first = result[0] as { result?: unknown } | unknown;
  const raw =
    typeof first === 'object' && first !== null && 'result' in first
      ? (first as { result: unknown }).result
      : first;
  const count = Number(raw);
  if (!Number.isFinite(count)) return null;
  const resetAt = (slot + 1) * windowMs;
  return {
    ok: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

/**
 * Sync rate-limit check. Uses in-memory backend only — call `rateLimitAsync`
 * when a shared/distributed limit matters (Redis-backed).
 */
export function rateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  const limit = opts.limit ?? 60;
  const windowMs = opts.windowMs ?? 60_000;
  return memoryLimit(key, limit, windowMs);
}

/**
 * Async rate-limit check. When Redis is configured it is the only
 * authoritative backend; on any Redis failure the request is denied
 * (fail-closed) to prevent per-instance in-memory fallback from
 * weakening the distributed limit. When Redis is not configured, the
 * in-memory limiter is used (dev / single-instance).
 */
export async function rateLimitAsync(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): Promise<RateLimitResult> {
  const limit = opts.limit ?? 60;
  const windowMs = opts.windowMs ?? 60_000;
  if (REDIS_ENABLED) {
    const r = await redisLimit(key, limit, windowMs);
    if (r) return r;
    // Redis is configured but unreachable. Refuse the request so the
    // distributed rate-limit cannot be silently downgraded to N
    // independent per-instance buckets. The caller should surface this
    // as 429; the operator must restore Redis.
    logRedisUnavailable(key, limit, windowMs);
    return { ok: false, limit, remaining: 0, resetAt: Date.now() + windowMs };
  }
  return memoryLimit(key, limit, windowMs);
}

function logRedisUnavailable(key: string, limit: number, windowMs: number) {
  // Structured single-line JSON so log aggregators (Loki/Datadog/Vercel)
  // can alert on this. Best-effort: never throw out of the limiter.
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level: 'error',
      msg: 'rate_limit.redis_unavailable_fail_closed',
      scope: key,
      limit,
      windowMs,
    });
    -- limiter is a sanctioned console sink for this signal
    console.error(line);
  } catch {
    /* ignore logging failures */
  }
}

/** True when a shared (multi-instance) backend is active. */
export const isDistributedRateLimit = REDIS_ENABLED;

export function clientKey(req: Request, scope: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'anon';
  return `${scope}:${ip}`;
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(r.limit),
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Reset': String(Math.ceil(r.resetAt / 1000)),
  };
  if (!r.ok) {
    headers['Retry-After'] = String(Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1000)));
  }
  return headers;
}
