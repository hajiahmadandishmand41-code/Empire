/**
 * GET /api/search/instant
 *
 * Instant search — small, fast result set for live search dropdowns.
 * Returns up to 8 products sorted by relevance + popularity.
 *
 * Query params:
 *   q    — search query (min 2 chars)
 *   limit — max results (default 6, max 12)
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { getSearchService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

const instantSchema = z.object({
  q: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().positive().max(12).optional(),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'search:instant'), { limit: 300 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = instantSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return jsonError('invalid_query', 'Invalid search parameters', {
      status: 400,
      details: { issues: parsed.error.issues },
    });
  }

  const { q, limit = 6 } = parsed.data;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Search is unavailable', { status: 503 });
  }

  try {
    const svc = getSearchService();
    const result = await svc.search({ q, pageSize: limit, instant: true });
    return jsonOk(result.products, {
      meta: {
        source: 'db',
        query: q,
        durationMs: result.meta.durationMs,
      },
    });
  } catch (err) {
    console.error('[api/search/instant]', err);
    return jsonError('internal_error', 'Search failed', { status: 500 });
  }
}
