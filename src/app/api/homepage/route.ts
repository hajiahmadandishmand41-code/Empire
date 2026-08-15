/**
 * GET /api/homepage
 *
 * Homepage product sections — returns all display sections in a single request.
 *
 * Each section uses a different ranking signal:
 *   newest      — most recently added products
 *   bestSelling — highest salesCount
 *   mostViewed  — highest viewCount
 *   popular     — highest wishlistCount + salesCount combined
 *   featured    — discounted or promoted products
 *
 * All sections only show REAL seller-registered products.
 * No demo or seed data is ever returned.
 *
 * This endpoint is designed to power the homepage without requiring
 * multiple parallel API calls from the client.
 */
import type { NextRequest } from 'next/server';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { getProductService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'homepage'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const sp = req.nextUrl.searchParams;
  const sectionSize = Math.min(20, Math.max(4, parseInt(sp.get('size') ?? '8', 10) || 8));

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Homepage catalog is unavailable', { status: 503 });
  }

  try {
    const svc = getProductService();
    const sections = await svc.getHomepageSections(sectionSize);

    return jsonOk(sections, {
      meta: {
        source: 'db',
        sectionSize,
        totalSections: Object.keys(sections).length,
      },
    });
  } catch (err) {
    console.error('[api/homepage]', err);
    return jsonError('internal_error', 'Failed to load homepage data', { status: 500 });
  }
}
