/**
 * Reviews API for a product.
 *
 * GET  /api/products/:slug/reviews — list approved reviews + rating summary
 * POST /api/products/:slug/reviews — authenticated customer creates/updates review
 *
 * Architecture:
 *   - Uses ReviewRepository via registry
 *   - Verified-purchase enforcement at service level
 */
import type { NextRequest } from 'next/server';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { productSlugSchema, reviewCreateSchema } from '@/lib/validation/product';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { getCurrentUser } from '@/lib/auth';
import { mapReview } from '@/lib/db-mappers-phase6';
import { getReviewRepository } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rl = await rateLimitAsync(clientKey(req, 'reviews:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = productSlugSchema.safeParse(slug);
  if (!parsed.success) return jsonError('invalid_slug', 'Invalid product slug', { status: 400 });

  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const product = await prisma.product.findUnique({
    where: { slug: parsed.data },
    select: { id: true },
  });
  if (!product) return jsonError('not_found', 'Product not found', { status: 404 });

  try {
    const repo = getReviewRepository();
    const [reviews, summary] = await Promise.all([
      repo.findByProduct(product.id, true),
      repo.summarize(product.id),
    ]);

    return jsonOk(
      { reviews: reviews.map(mapReview), summary },
      { meta: { source: 'db' } },
    );
  } catch (err) {
    console.error('[api/products/:slug/reviews GET]', err);
    return jsonError('internal_error', 'Failed to load reviews', { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rl = await rateLimitAsync(clientKey(req, 'reviews:create'), { limit: 20 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsedSlug = productSlugSchema.safeParse(slug);
  if (!parsedSlug.success) return jsonError('invalid_slug', 'Invalid product slug', { status: 400 });

  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Sign in required', { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_body', 'Invalid JSON body', { status: 400 });
  }

  const parsedBody = reviewCreateSchema.safeParse(body);
  if (!parsedBody.success) {
    return jsonError('invalid_body', 'Invalid review payload', {
      status: 400,
      details: { issues: parsedBody.error.issues },
    });
  }

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database not configured', { status: 503 });
  }

  const product = await prisma.product.findUnique({
    where: { slug: parsedSlug.data },
    select: { id: true, isActive: true },
  });
  if (!product || !product.isActive) {
    return jsonError('not_found', 'Product not found', { status: 404 });
  }

  try {
    const repo = getReviewRepository();

    // Verified-purchase enforcement — only customers who received the product may review
    const hasPurchase = await repo.hasVerifiedPurchase(user.id, product.id);
    if (!hasPurchase) {
      return jsonError(
        'purchase_required',
        'برای ثبت نظر باید این محصول را خریداری و دریافت کرده باشید.',
        { status: 403 },
      );
    }

    const review = await repo.upsert({
      productId: product.id,
      userId: user.id,
      rating: parsedBody.data.rating,
      title: parsedBody.data.title,
      comment: parsedBody.data.comment,
    });

    return jsonOk(mapReview(review), { status: 201 });
  } catch (err) {
    console.error('[api/products/:slug/reviews POST]', err);
    return jsonError('internal_error', 'Failed to submit review', { status: 500 });
  }
}
