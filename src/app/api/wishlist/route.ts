/**
 * GET  /api/wishlist        — list current user's favorite products.
 * POST /api/wishlist        — add a product by { productId } or { slug }.
 *
 * Phase 6.
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { getCurrentUser } from '@/lib/auth';
import { wishlistAddSchema } from '@/lib/validation/product';
import { mapProductSummary } from '@/lib/db-mappers';
import { mapWishlistEntry } from '@/lib/db-mappers-phase6';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'wishlist:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Sign in required', { status: 401 });

  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const rows = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { category: true, seller: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return jsonOk(
    rows.map((w) =>
      mapWishlistEntry({
        ...w,
        product: mapProductSummary(w.product as never),
      }),
    ),
    { meta: { source: 'db' } },
  );
}

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'wishlist:add'), { limit: 60 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Sign in required', { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_body', 'Invalid JSON body', { status: 400 });
  }
  const parsed = wishlistAddSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid wishlist payload', {
      status: 400,
      details: { issues: parsed.error.issues },
    });
  }

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database not configured', { status: 503 });
  }

  const product = parsed.data.productId
    ? await prisma.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true } })
    : await prisma.product.findUnique({ where: { slug: parsed.data.slug! }, select: { id: true } });
  if (!product) return jsonError('not_found', 'Product not found', { status: 404 });

  const saved = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: user.id, productId: product.id } },
    create: { userId: user.id, productId: product.id },
    update: {},
    include: { product: { include: { category: true, seller: true } } },
  });

  return jsonOk(
    mapWishlistEntry({
      ...saved,
      product: mapProductSummary(saved.product as never),
    }),
    { status: 201, meta: { source: 'db' } },
  );
}
