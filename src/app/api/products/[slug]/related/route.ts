/**
 * GET /api/products/:slug/related
 *
 * Related products using ProductService.getRelatedProducts().
 * Same-category products first, then fills from top-selling catalog.
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
  const rl = await rateLimitAsync(clientKey(req, 'products:related'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = productSlugSchema.safeParse(slug);
  if (!parsed.success) return jsonError('invalid_slug', 'Invalid product slug', { status: 400 });

  const rawLimit = req.nextUrl.searchParams.get('limit');
  const parsedLimit = rawLimit == null ? 4 : Number(rawLimit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 12) {
    return jsonError('invalid_limit', 'Limit must be an integer between 1 and 12', {
      status: 400,
    });
  }
  const limit = parsedLimit;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Product catalog is unavailable', { status: 503 });
  }

  try {
    const svc = getProductService();
    const related = await svc.getRelatedProducts(parsed.data, limit);
    return jsonOk(related, { meta: { source: 'db' } });
  } catch (err) {
    console.error('[api/products/:slug/related]', err);
    return jsonError('internal_error', 'Failed to fetch related products', { status: 500 });
  }
}
