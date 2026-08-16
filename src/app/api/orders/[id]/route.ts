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
    const row = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { reference: orderId }] },
      include: { items: { include: { product: true } }, address: true },
    });
    if (!row) return jsonError('not_found', 'Order not found', { status: 404 });

    const user = await getCurrentUser();
    const isOwner = Boolean(user && row.userId && row.userId === user.id);
    const isAdmin = user?.role === 'admin';
    const isSeller = user?.role === 'seller' && row.items.some((i) => i.product?.sellerId && i.product.sellerId === user.id);
    const cookieToken = req.cookies.get(guestReceiptCookieName(row.id))?.value;
    const isGuestReceipt = !row.userId && !user && verifyGuestReceiptToken(cookieToken, row.id);

    if (!isOwner && !isAdmin && !isSeller && !isGuestReceipt) return jsonError('forbidden', 'Not allowed to view this order', { status: 403 });
    return jsonOk(mapOrder(row));
  } catch (err) {
    logger.error('orders.get_failed', {}, err);
    return jsonError('server_error', 'Failed to load order', { status: 500 });
  }
}
