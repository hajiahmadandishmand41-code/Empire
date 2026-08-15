/**
 * Seller order status endpoint — Phase 4.
 *
 * Sellers may only advance the "preparation" side of the order lifecycle
 * (confirmed → processing → shipped). They cannot cancel orders, mark
 * them delivered, or touch the payment status — that stays with admins
 * so Phase 1 (payments) and Phase 3 (shipping/delivery) remain intact.
 *
 * Stage 6 fix:
 *  - console.error replaced with structured logger.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const SELLER_ALLOWED = new Set(['confirmed', 'processing', 'shipped']);
const SELLER_TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(['confirmed']),
  confirmed: new Set(['processing']),
  processing: new Set(['shipped']),
};

const patchSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return jsonError('invalid_body', 'Invalid status', {
      status: 422,
      details: { issues: parsed.error.issues },
    });

  if (!isDatabaseConfigured())
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { reference: id }] },
    include: { items: { select: { product: { select: { sellerId: true } } } } },
  });
  if (!order) return jsonError('not_found', 'Order not found', { status: 404 });

  const isAdmin = guard.user.role === 'admin';
  const isSeller =
    guard.user.role === 'seller' &&
    order.items.some((i) => i.product?.sellerId === guard.user.id);
  if (!isAdmin && !isSeller)
    return jsonError('forbidden', 'You are not the seller for this order', { status: 403 });

  if (!isAdmin && !SELLER_ALLOWED.has(parsed.data.status)) {
    return jsonError(
      'status_not_allowed',
      'Sellers can only set: confirmed, processing, shipped',
      { status: 403 },
    );
  }
  if (!isAdmin && !SELLER_TRANSITIONS[order.status]?.has(parsed.data.status)) {
    return jsonError('invalid_transition', 'Order status can only advance to the next step', {
      status: 409,
    });
  }
  if (!isAdmin && (order.status === 'delivered' || order.status === 'cancelled')) {
    return jsonError('order_locked', 'Order is closed and cannot be changed', { status: 409 });
  }

  try {
    const transitioned = await prisma.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: parsed.data.status },
    });
    if (transitioned.count === 0) {
      return jsonError('conflict', 'Order status changed concurrently. Please retry.', {
        status: 409,
      });
    }
    const updated = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { id: true, status: true, reference: true },
    });
    return jsonOk(updated);
  } catch (err) {
    logger.error('seller.orders.status.patch_failed', { orderId: order.id, sellerId: guard.user.id }, err);
    return jsonError('update_failed', 'Failed to update status', { status: 500 });
  }
}
