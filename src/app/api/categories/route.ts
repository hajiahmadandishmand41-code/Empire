/**
 * GET /api/categories
 *
 * Public category listing with product counts.
 * Uses CategoryRepository via registry.
 */
import type { NextRequest } from 'next/server';
import { jsonOk, jsonPreflight, jsonError } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { getCategoryRepository } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'categories:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Category catalog is unavailable', { status: 503 });
  }

  try {
    const repo = getCategoryRepository();
    const rows = await repo.findAll(true);

    return jsonOk(
      rows.map((r) => ({
        key: r.key,
        name: r.name,
        slug: r.slug,
        productCount: r.productCount,
      })),
      { meta: { source: 'db' } },
    );
  } catch (err) {
    console.error('[api/categories]', err);
    return jsonError('internal_error', 'Failed to fetch categories', { status: 500 });
  }
}
