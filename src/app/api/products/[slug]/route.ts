/**
 * GET /api/products/:slug
 *
 * Single product detail with database-backed locale overlays.
 */
import type { NextRequest } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { productSlugSchema } from '@/lib/validation/product';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { getProductService } from '@/server/infrastructure/registry';
import { getProductLocalizedText, normalizeCatalogLocale } from '@/server/localization/product-localization';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rl = await rateLimitAsync(clientKey(req, 'products:slug'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = productSlugSchema.safeParse(slug);
  if (!parsed.success) return jsonError('invalid_slug', 'Invalid product slug', { status: 400 });
  const locale = normalizeCatalogLocale(req.nextUrl.searchParams.get('locale'));

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Product catalog is unavailable', { status: 503 });
  }

  try {
    const svc = getProductService();
    const product = await svc.getProductBySlug(parsed.data);
    if (!product) return jsonError('not_found', 'Product not found', { status: 404 });

    const text = await getProductLocalizedText(product.id, locale);
    const localizedProduct = text
      ? {
          ...product,
          name: text.name,
          shortDescription: text.shortDescription,
          description: text.description ? text.description.split('\n\n') : undefined,
        }
      : product;

    return jsonOk(localizedProduct, { meta: { source: 'db', locale: text?.locale ?? 'fa' } });
  } catch (err) {
    console.error('[api/products/:slug]', err);
    return jsonError('internal_error', 'Failed to fetch product', { status: 500 });
  }
}
