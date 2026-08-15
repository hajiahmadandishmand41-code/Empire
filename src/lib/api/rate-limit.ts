/**
 * Sliding-window rate limiter with Redis and in-memory backends.
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

function gc(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_BUCKETS / 2) break;
  }
}

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  gc(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: Math.max(0, limit - 1), resetAt };
  }
  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

type RedisResponse = { result?: unknown };

function isRedisResponse(value: unknown): value is RedisResponse {
  return typeof value === 'object' && value !== null && 'result' in value;
}

async function redisPipeline(commands: Array<Array<string | number>>): Promise<unknown[] | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const response = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(250),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function redisLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult | null> {
  const now = Date.now();
  const slot = Math.floor(now / windowMs);
  const redisKey = `rl:${key}:${slot}`;
  const result = await redisPipeline([
    ['INCR', redisKey],
    ['PEXPIRE', redisKey, windowMs],
  ]);
  if (!result || result.length === 0) return null;

  const first = result[0];
  const raw = isRedisResponse(first) ? first.result : first;
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

export function rateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  return memoryLimit(key, opts.limit ?? 60, opts.windowMs ?? 60_000);
}

export async function rateLimitAsync(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): Promise<RateLimitResult> {
  const limit = opts.limit ?? 60;
  const windowMs = opts.windowMs ?? 60_000;
  if (!REDIS_ENABLED) return memoryLimit(key, limit, windowMs);

  const result = await redisLimit(key, limit, windowMs);
  if (result) return result;

  logRedisUnavailable(key, limit, windowMs);
  return { ok: false, limit, remaining: 0, resetAt: Date.now() + windowMs };
}

function logRedisUnavailable(key: string, limit: number, windowMs: number): void {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level: 'error',
      msg: 'rate_limit.redis_unavailable_fail_closed',
      scope: key,
      limit,
      windowMs,
    });
    console.error(line);
  } catch {
    // Logging must never change rate-limit behavior.
  }
}

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
