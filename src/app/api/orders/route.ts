import crypto from 'crypto';
/**
 * Orders API.
 * Orders are authenticated-only. The Idempotency-Key header prevents
 * duplicate order creation on retries.
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { orderDraftSchema } from '@/lib/validation/order';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { mapOrder } from '@/lib/db-mappers';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listUserOrders } from '@/features/orders/lib/queries';
import { logger } from '@/lib/logger';
import {
  COD_RESERVATION_MINUTES,
  MANUAL_PAYMENT_RESERVATION_MINUTES,
  ONLINE_RESERVATION_MINUTES,
  createOrderStockReservations,
  createSellerOrders,
  releaseExpiredStockReservations,
} from '@/lib/orders/order-engine';

export const dynamic = 'force-dynamic';

class OrderCreationError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

function idempotentReference(idempotencyKey: string, userId: string): string {
  const digest = crypto.createHash('sha256').update(`${userId}:${idempotencyKey}`).digest('hex').slice(0, 24).toUpperCase();
  return `EMP-I-${digest}`;
}

function reservationMinutes(paymentMethod: string): number {
  if (paymentMethod === 'cod') return COD_RESERVATION_MINUTES;
  if (paymentMethod === 'bank_transfer' || paymentMethod === 'whatsapp') return MANUAL_PAYMENT_RESERVATION_MINUTES;
  return ONLINE_RESERVATION_MINUTES;
}

export async function OPTIONS() { return jsonPreflight(); }

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'orders:create'), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const currentUser = await getCurrentUser();
  if (!currentUser) return jsonError('unauthorized', 'Authentication required before checkout', { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Request body is not valid JSON', { status: 400 }); }

  const parsed = orderDraftSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid order payload', { status: 422, details: { issues: parsed.error.issues } });

  const idempotencyKey = req.headers.get('idempotency-key')?.trim() || null;
  if (idempotencyKey && (idempotencyKey.length < 16 || idempotencyKey.length > 128)) {
    return jsonError('invalid_idempotency_key', 'Idempotency-Key must be between 16 and 128 characters', { status: 422 });
  }

  const draft = parsed.data;
  let reference: string | null = null;

  try {
    if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

    reference = idempotencyKey
      ? idempotentReference(idempotencyKey, currentUser.id)
      : `EMP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({ where: { reference }, include: { items: true, address: true, shippingMethod: true } });
      if (existing) {
        if (existing.userId !== currentUser.id) return jsonError('forbidden', 'This idempotency key belongs to another order owner', { status: 403 });
        const response = jsonOk(mapOrder(existing), { status: 200, meta: { source: 'idempotent-replay' } });
        response.headers.set('Idempotency-Key', idempotencyKey);
        return response;
      }
    }

    let shippingCost = new Prisma.Decimal(0);
    let shippingMethodId: string | null = null;
    if (draft.shippingMethodId || draft.shippingMethodKey) {
      const sm = await prisma.shippingMethod.findFirst({
        where: { isActive: true, OR: [
          ...(draft.shippingMethodId ? [{ id: draft.shippingMethodId }] : []),
          ...(draft.shippingMethodKey ? [{ key: draft.shippingMethodKey }] : []),
        ] },
      });
      if (!sm) return jsonError('unknown_shipping_method', 'Shipping method not available', { status: 422 });
      shippingCost = sm.cost;
      shippingMethodId = sm.id;
    }

    const products = await prisma.product.findMany({ where: { slug: { in: draft.items.map((i) => i.slug) } } });
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    for (const item of draft.items) {
      const p = bySlug.get(item.slug);
      if (!p) return jsonError('unknown_product', `Unknown product: ${item.slug}`, { status: 422 });
      if (!p.isActive || !p.inStock) return jsonError('product_unavailable', `Product not available: ${item.slug}`, { status: 422 });
    }

    const currencies = new Set(products.map((p) => p.currency));
    if (currencies.size !== 1) return jsonError('mixed_currency', 'Products in one order must use the same currency', { status: 422 });
    const orderCurrency = [...currencies][0];
    if (shippingMethodId) {
      const shippingMethod = await prisma.shippingMethod.findUnique({ where: { id: shippingMethodId }, select: { currency: true } });
      if (!shippingMethod || shippingMethod.currency !== orderCurrency) return jsonError('currency_mismatch', 'Shipping method currency does not match the order', { status: 422 });
    }

    const subtotal = draft.items.reduce((sum, item) => sum.add(bySlug.get(item.slug)!.price.mul(item.quantity)), new Prisma.Decimal(0)).toDecimalPlaces(2);
    const itemCount = draft.items.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = shippingCost.toDecimalPlaces(2);
    const total = subtotal.add(shipping).toDecimalPlaces(2);

    const createdBase = await prisma.$transaction(async (tx) => {
      // Clean up reservations abandoned by previous checkouts before competing for stock.
      await releaseExpiredStockReservations(tx);

      let addressId: string;
      let addressSnapshot: {
        fullName: string; phone: string; province: string; district: string; city: string | null;
        addressLine: string; postalCode: string | null; notes: string | null;
      };

      if (draft.addressId) {
        const existing = await tx.address.findFirst({ where: { id: draft.addressId, userId: currentUser.id } });
        if (!existing) throw new OrderCreationError('address_not_found', 'Address not found for user');
        addressId = existing.id;
        addressSnapshot = existing;
      } else if (draft.address) {
        const addr = await tx.address.create({ data: { ...draft.address, userId: currentUser.id } });
        addressId = addr.id;
        addressSnapshot = addr;
      } else {
        throw new OrderCreationError('address_required', 'No address provided');
      }

      for (const item of draft.items) {
        const product = bySlug.get(item.slug)!;
        const res = await tx.product.updateMany({
          where: { id: product.id, isActive: true, inStock: true, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (res.count === 0) throw new OrderCreationError('out_of_stock', `Product out of stock: ${product.slug}`);
      }

      await tx.product.updateMany({
        where: { id: { in: draft.items.map((i) => bySlug.get(i.slug)!.id) }, stockQuantity: { lte: 0 } },
        data: { inStock: false },
      });

      const order = await tx.order.create({
        data: {
          reference: reference!,
          status: 'pending',
          paymentMethod: draft.paymentMethod,
          subtotal,
          shipping,
          total,
          currency: orderCurrency,
          itemCount,
          userId: currentUser.id,
          addressId,
          shippingMethodId,
          shippingFullName: addressSnapshot.fullName,
          shippingPhone: addressSnapshot.phone,
          shippingProvince: addressSnapshot.province,
          shippingDistrict: addressSnapshot.district,
          shippingCity: addressSnapshot.city,
          shippingAddressLine: addressSnapshot.addressLine,
          shippingPostalCode: addressSnapshot.postalCode,
          shippingNotes: addressSnapshot.notes,
          items: { create: draft.items.map((item) => {
            const product = bySlug.get(item.slug)!;
            return { productId: product.id, slug: product.slug, name: product.name, price: product.price, quantity: item.quantity };
          }) },
        },
      });

      await createSellerOrders(tx, order.id, shipping, orderCurrency);
      await createOrderStockReservations(tx, order.id, reservationMinutes(draft.paymentMethod));
      return order;
    });

    const created = await prisma.order.findUniqueOrThrow({
      where: { id: createdBase.id },
      include: { items: true, address: true, shippingMethod: true },
    });

    const response = jsonOk(mapOrder(created), { status: 201, meta: { source: 'db' } });
    if (idempotencyKey) response.headers.set('Idempotency-Key', idempotencyKey);
    return response;
  } catch (error) {
    if (error instanceof OrderCreationError) return jsonError(error.code, error.message, { status: error.code === 'out_of_stock' ? 409 : 422 });
    logger.error('orders.create_failed', {}, error);
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2002' && idempotencyKey && reference) {
        const existing = await prisma.order.findUnique({ where: { reference }, include: { items: true, address: true, shippingMethod: true } });
        if (existing && existing.userId === currentUser.id) {
          const response = jsonOk(mapOrder(existing), { status: 200, meta: { source: 'idempotent-race-replay' } });
          response.headers.set('Idempotency-Key', idempotencyKey);
          return response;
        }
      }
      if (code === 'P2002') return jsonError('conflict', 'Order could not be created due to a duplicate reference', { status: 409 });
      if (code === 'P2003') return jsonError('relation_conflict', 'Order references an invalid resource', { status: 409 });
    }
    return jsonError('order_create_failed', 'Failed to create order', { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'orders:list'), { limit: 60 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });
  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Authentication required', { status: 401 });
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.get('pageSize') ?? '10', 10) || 10));
  const status = sp.get('status') ?? undefined;
  const result = await listUserOrders({ userId: user.id, page, pageSize, status });
  return jsonOk(result, { meta: { source: result.source } });
}
