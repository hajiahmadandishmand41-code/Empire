/** Seller-scoped order status endpoint. */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { syncParentOrderStatus } from '@/lib/orders/order-engine';

export const dynamic = 'force-dynamic';

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
  if (guard.user.role !== 'seller') return jsonError('forbidden', 'Use the admin order endpoint for administrative status changes.', { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid status', { status: 422, details: { issues: parsed.error.issues } });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const order = await prisma.order.findFirst({ where: { OR: [{ id }, { reference: id }] }, select: { id: true, paymentMethod: true, paymentStatus: true } });
  if (!order) return jsonError('not_found', 'Order not found', { status: 404 });

  try {
    const rows = await prisma.$queryRaw<Array<{ status: string }>>(Prisma.sql`
      SELECT "status" FROM "SellerOrder" WHERE "orderId" = ${order.id} AND "sellerId" = ${guard.user.id} LIMIT 1
    `);
    const sellerOrder = rows[0];
    if (!sellerOrder) return jsonError('forbidden', 'You are not a seller for this order', { status: 403 });
    if (!SELLER_TRANSITIONS[sellerOrder.status]?.has(parsed.data.status)) return jsonError('invalid_transition', 'Seller order status can only advance one step at a time.', { status: 409 });
    if (order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid') return jsonError('payment_required', 'Online payment must be confirmed before the seller can process this order.', { status: 409 });

    const transitioned = await prisma.$executeRaw(Prisma.sql`
      UPDATE "SellerOrder"
      SET "status" = ${parsed.data.status}, "updatedAt" = NOW()
      WHERE "orderId" = ${order.id} AND "sellerId" = ${guard.user.id} AND "status" = ${sellerOrder.status}
    `);
    if (Number(transitioned) === 0) return jsonError('conflict', 'Seller order changed concurrently. Please retry.', { status: 409 });
    await syncParentOrderStatus(prisma, order.id);
    const updated = await prisma.$queryRaw<Array<{ status: string }>>(Prisma.sql`
      SELECT "status" FROM "SellerOrder" WHERE "orderId" = ${order.id} AND "sellerId" = ${guard.user.id} LIMIT 1
    `);
    return jsonOk({ id: order.id, sellerStatus: updated[0]?.status ?? parsed.data.status });
  } catch (err) {
    logger.error('seller.orders.status.patch_failed', { orderId: order.id, sellerId: guard.user.id }, err);
    return jsonError('update_failed', 'Failed to update seller order status', { status: 500 });
  }
}
