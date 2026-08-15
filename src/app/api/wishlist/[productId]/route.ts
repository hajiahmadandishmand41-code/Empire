/**
 * DELETE /api/wishlist/:productId — remove a product from wishlist.
 *
 * Phase 6.
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const rl = await rateLimitAsync(clientKey(req, 'wishlist:remove'), { limit: 60 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Sign in required', { status: 401 });

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database not configured', { status: 503 });
  }

  const normalizedProductId = String(productId ?? '').trim();
  if (!normalizedProductId) return jsonError('invalid_id', 'Invalid product id', { status: 400 });

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId: normalizedProductId },
  });

  return jsonOk({ removed: true });
}
