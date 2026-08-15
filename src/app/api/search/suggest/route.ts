/**
 * GET /api/search/suggest
 *
 * Live/instant search suggestions for autocomplete UI.
 *
 * Optimized for low latency (target < 150ms):
 *   - Small result set (default 8)
 *   - Cached candidate list
 *   - Returns before full re-ranking completes
 *
 * Query params:
 *   q     — partial query (min 2 chars)
 *   limit — max suggestions (default 8, max 20)
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { getSearchService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

const suggestSchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().positive().max(20).optional(),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  // Higher rate limit for live search (fires on every keystroke)
  const rl = await rateLimitAsync(clientKey(req, 'search:suggest'), { limit: 300 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = suggestSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return jsonError('invalid_query', 'Invalid query', { status: 400 });
  }

  const { q, limit = 8 } = parsed.data;

  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const svc = getSearchService();
    const result = await svc.suggest(q, limit);
    return jsonOk(result.suggestions, {
      meta: { source: 'db', query: q, durationMs: result.durationMs },
    });
  } catch (err) {
    console.error('[api/search/suggest]', err);
    // Surface the error as HTTP 500 so callers and monitoring can detect
    // search backend failures instead of silently receiving empty results.
    return jsonError('suggest_failed', 'Search suggestion service error', { status: 500 });
  }
}
