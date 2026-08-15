/**
 * GET /api/products/:slug
 *
 * Single product detail. Uses ProductService which:
 *   - Validates the product exists and is active
 *   - Increments view count atomically (fire-and-forget)
 *   - Fetches aggregate rating
 *   - Maps DB row → typed Product domain object
 */
import type { NextRequest } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { productSlugSchema } from '@/lib/validation/product';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { getProductService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rl = await rateLimitAsync(clientKey(req, 'products:slug'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = productSlugSchema.safeParse(slug);
  if (!parsed.success) {
    return jsonError('invalid_slug', 'Invalid product slug', { status: 400 });
  }
  const productSlug = parsed.data;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Product catalog is unavailable', { status: 503 });
  }

  try {
    const svc = getProductService();
    const product = await svc.getProductBySlug(productSlug);
    if (!product) return jsonError('not_found', 'Product not found', { status: 404 });
    return jsonOk(product, { meta: { source: 'db' } });
  } catch (err) {
    console.error('[api/products/:slug]', err);
    return jsonError('internal_error', 'Failed to fetch product', { status: 500 });
  }
}
