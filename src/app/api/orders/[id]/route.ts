/** Protected order lookup API. Guest access requires an order-scoped signed receipt cookie. */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { mapOrder } from '@/lib/db-mappers';
import { getCurrentUser } from '@/lib/auth/current-user';
import { logger } from '@/lib/logger';
import { guestReceiptCookieName, verifyGuestReceiptToken } from '@/lib/auth/guest-receipt';

export const dynamic = 'force-dynamic';
const idSchema = z.string().trim().min(1).max(80);

export async function OPTIONS() { return jsonPreflight(); }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rl = await rateLimitAsync(clientKey(req, 'orders:get'), { limit: 60 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return jsonError('invalid_id', 'Invalid order id', { status: 400 });
  const orderId = parsed.data;
  if (!isDatabaseConfigured()) return jsonError('not_found', 'Order not found', { status: 404 });

  try {
    const user = await getCurrentUser();
    const isSeller = user?.role === 'seller';

    // Seller authorization is SellerOrder-scoped. Never authorize a seller from a
    // parent Order merely because one of its items belongs to that seller.
    if (isSeller) {
      const sellerOrder = await prisma.$queryRaw<Array<{
        id: string; orderId: string; sellerId: string; status: string;
        subtotal: unknown; shipping: unknown; total: unknown; currency: string; itemCount: number;
      }>>`
        SELECT "id", "orderId", "sellerId", "status", "subtotal", "shipping", "total", "currency", "itemCount"
        FROM "SellerOrder"
        WHERE ("orderId" = ${orderId} OR "orderId" = (SELECT "id" FROM "Order" WHERE "reference" = ${orderId} LIMIT 1))
          AND "sellerId" = ${user.id}
        LIMIT 1
      `;
      const scoped = sellerOrder[0];
      if (!scoped) return jsonError('not_found', 'Order not found', { status: 404 });

      const row = await prisma.order.findUnique({
        where: { id: scoped.orderId },
        include: { address: true, shippingMethod: true },
      });
      if (!row) return jsonError('not_found', 'Order not found', { status: 404 });

      const items = await prisma.orderItem.findMany({
        where: { orderId: row.id, product: { sellerId: user.id } },
        select: { slug: true, name: true, price: true, quantity: true },
        orderBy: { id: 'asc' },
      });
      return jsonOk({
        id: row.id,
        reference: row.reference,
        status: scoped.status,
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        items: items.map((item) => ({ slug: item.slug, name: item.name, price: Number(item.price), quantity: item.quantity })),
        address: {
          id: row.address.id,
          fullName: row.shippingFullName ?? row.address.fullName,
          phone: row.shippingPhone ?? row.address.phone,
          province: row.shippingProvince ?? row.address.province,
          district: row.shippingDistrict ?? row.address.district,
          city: row.shippingCity ?? row.address.city ?? undefined,
          addressLine: row.shippingAddressLine ?? row.address.addressLine,
          postalCode: row.shippingPostalCode ?? row.address.postalCode ?? undefined,
          notes: row.shippingNotes ?? row.address.notes ?? undefined,
          label: row.address.label ?? undefined,
          isDefault: row.address.isDefault,
        },
        shippingCost: Number(scoped.shipping),
        shippingMethod: row.shippingMethod,
        shippingMethodId: row.shippingMethodId ?? undefined,
        summary: {
          itemCount: scoped.itemCount,
          subtotal: Number(scoped.subtotal),
          currency: scoped.currency,
        },
      }, { req });
    }

    const row = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { reference: orderId }] },
      include: { items: { include: { product: true } }, address: true, shippingMethod: true },
    });
    if (!row) return jsonError('not_found', 'Order not found', { status: 404 });

    const isOwner = Boolean(user && row.userId && row.userId === user.id);
    const isAdmin = user?.role === 'admin';
    const cookieToken = req.cookies.get(guestReceiptCookieName(row.id))?.value;
    const isGuestReceipt = !row.userId && !user && verifyGuestReceiptToken(cookieToken, row.id);

    if (!isOwner && !isAdmin && !isGuestReceipt) return jsonError('forbidden', 'Not allowed to view this order', { status: 403 });
    return jsonOk(mapOrder(row), { req });
  } catch (err) {
    logger.error('orders.get_failed', {}, err);
    return jsonError('server_error', 'Failed to load order', { status: 500 });
  }
}
