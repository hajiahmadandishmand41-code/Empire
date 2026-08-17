/**
 * GET /api/categories
 *
 * Public category listing with product counts and locale-aware names.
 */
import type { NextRequest } from 'next/server';
import { jsonOk, jsonPreflight, jsonError } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { getCategoryRepository } from '@/server/infrastructure/registry';
import { getCategoryLocalizedText, normalizeCatalogLocale } from '@/server/localization/product-localization';

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
    const locale = normalizeCatalogLocale(req.nextUrl.searchParams.get('locale'));
    const localized = await Promise.all(rows.map(async (row) => {
      const text = await getCategoryLocalizedText(row.id, locale);
      return {
        key: row.key,
        name: text?.name ?? row.name,
        slug: row.slug,
        productCount: row.productCount,
      };
    }));

    return jsonOk(localized, { meta: { source: 'db', locale } });
  } catch (err) {
    console.error('[api/categories]', err);
    return jsonError('internal_error', 'Failed to fetch categories', { status: 500 });
  }
}
