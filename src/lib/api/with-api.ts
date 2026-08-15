/**
 * withApi — Phase 8 API wrapper.
 *
 * Wraps a Next.js Route Handler to add:
 *   - request-id tracing
 *   - structured logging (start / finish / error)
 *   - centralised error → JSON response mapping
 *   - optional rate limiting (per-IP + per-scope)
 *
 * Existing routes keep working unchanged; adopt gradually by replacing
 * `export async function GET(req) { ... }` with
 * `export const GET = withApi('scope', async (req) => { ... })`.
 *
 * Rate limiting uses `rateLimitAsync` so that when Upstash Redis is
 * configured, limits are shared across all instances in production.
 * In single-instance or dev environments the in-memory backend is used
 * automatically — no code change needed.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger, newRequestId } from '@/lib/logger';
import { ApiError } from './errors';
import { jsonError } from './response';
import { clientKey, rateLimitAsync } from './rate-limit';

export interface WithApiOptions {
  /** Rate limit config; omit to disable. */
  rateLimit?: { limit: number; windowMs?: number };
}

type Handler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<Response> | Response;

export function withApi<Ctx = unknown>(
  scope: string,
  handler: Handler<Ctx>,
  opts: WithApiOptions = {},
) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    const requestId = req.headers.get('x-request-id') ?? newRequestId();
    const started = Date.now();
    const route = new URL(req.url).pathname;

    // Rate limiting (optional) — uses distributed Redis backend in production
    // when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
    if (opts.rateLimit) {
      const rl = await rateLimitAsync(clientKey(req, scope), opts.rateLimit);
      if (!rl.ok) {
        logger.warn('api.rate_limited', { requestId, route, method: req.method, scope });
        const res = jsonError('rate_limited', 'Too many requests', { status: 429 });
        res.headers.set('Retry-After', Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)).toString());
        res.headers.set('X-RateLimit-Remaining', '0');
        res.headers.set('X-Request-Id', requestId);
        return res;
      }
    }

    try {
      const res = await handler(req, ctx);
      res.headers.set('X-Request-Id', requestId);
      logger.info('api.ok', {
        requestId,
        route,
        method: req.method,
        status: res.status,
        durationMs: Date.now() - started,
      });
      return res;
    } catch (err) {
      const durationMs = Date.now() - started;

      if (err instanceof ZodError) {
        logger.warn('api.validation_error', { requestId, route, method: req.method, durationMs });
        const res = jsonError('VALIDATION_ERROR', 'Invalid input', {
          status: 422,
          details: { issues: err.flatten() },
        });
        res.headers.set('X-Request-Id', requestId);
        return res;
      }

      if (err instanceof ApiError) {
        logger.warn('api.error', {
          requestId,
          route,
          method: req.method,
          status: err.status ?? 400,
          code: err.code,
          durationMs,
        });
        const res = jsonError(err.code, err.message, {
          status: err.status ?? 400,
          details: err.details,
        });
        res.headers.set('X-Request-Id', requestId);
        return res;
      }

      logger.error(
        'api.unhandled',
        { requestId, route, method: req.method, durationMs },
        err,
      );
      const res = NextResponse.json(
        { ok: false, error: { code: 'internal_error', message: 'Internal server error' } },
        { status: 500 },
      );
      res.headers.set('X-Request-Id', requestId);
      return res;
    }
  };
}
