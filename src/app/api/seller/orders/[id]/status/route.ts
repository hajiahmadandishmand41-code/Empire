/** Seller order status endpoint. */
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
const patchSchema = z.object({ status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']) });

export async function OPTIONS() { return jsonPreflight(); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid status', { status: 422, details: { issues: parsed.error.issues } });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { reference: id }] },
    include: { items: { select: { product: { select: { sellerId: true } } } } },
  });
  if (!order) return jsonError('not_found', 'Order not found', { status: 404 });

  const isAdmin = guard.user.role === 'admin';
  const sellerItems = order.items.filter((item) => item.product?.sellerId === guard.user.id);
  const isSeller = guard.user.role === 'seller' && sellerItems.length > 0;
  if (!isAdmin && !isSeller) return jsonError('forbidden', 'You are not the seller for this order', { status: 403 });

  if (!isAdmin) {
    if (!SELLER_ALLOWED.has(parsed.data.status)) return jsonError('status_not_allowed', 'Sellers can only set: confirmed, processing, shipped', { status: 403 });
    // The current Order model has one fulfillment status for the whole order.
    // Do not let one seller mutate a multi-seller order globally until seller
    // sub-orders/item-level fulfillment exist.
    if (sellerItems.length !== order.items.length) {
      return jsonError('multi_seller_order', 'This order contains items from multiple sellers and requires seller-scoped fulfillment.', { status: 409 });
    }
    if (!SELLER_TRANSITIONS[order.status]?.has(parsed.data.status)) return jsonError('invalid_transition', 'Order status can only advance to the next step', { status: 409 });
    if (order.status === 'delivered' || order.status === 'cancelled') return jsonError('order_locked', 'Order is closed and cannot be changed', { status: 409 });
    if (order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid') {
      return jsonError('payment_required', 'Online payment must be confirmed before the seller can process this order.', { status: 409 });
    }
  }

  try {
    const transitioned = await prisma.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: parsed.data.status } });
    if (transitioned.count === 0) return jsonError('conflict', 'Order status changed concurrently. Please retry.', { status: 409 });
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, select: { id: true, status: true, reference: true } });
    return jsonOk(updated);
  } catch (err) {
    logger.error('seller.orders.status.patch_failed', { orderId: order.id, sellerId: guard.user.id }, err);
    return jsonError('update_failed', 'Failed to update status', { status: 500 });
  }
}
