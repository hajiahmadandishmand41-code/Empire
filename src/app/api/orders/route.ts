import crypto from 'crypto';
/**
 * Orders API.
 * Guest orders receive an order-scoped signed receipt cookie so public order
 * references are not sufficient to view or pay for another guest's order.
 * The Idempotency-Key header prevents duplicate order creation on retries.
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
import { createGuestReceiptToken, guestReceiptCookieName, guestReceiptCookieOptions } from '@/lib/auth/guest-receipt';

export const dynamic = 'force-dynamic';

class OrderCreationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function idempotentReference(idempotencyKey: string, userId: string | null): string {
  const scope = userId ?? 'guest';
  const digest = crypto.createHash('sha256').update(`${scope}:${idempotencyKey}`).digest('hex').slice(0, 24).toUpperCase();
  return `EMP-I-${digest}`;
}

export async function OPTIONS() {
  return jsonPreflight();
}

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'orders:create'), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Request body is not valid JSON', { status: 400 });
  }

  const parsed = orderDraftSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid order payload', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }

  const idempotencyKey = req.headers.get('idempotency-key')?.trim() || null;
  if (idempotencyKey && (idempotencyKey.length < 16 || idempotencyKey.length > 128)) {
    return jsonError('invalid_idempotency_key', 'Idempotency-Key must be between 16 and 128 characters', { status: 422 });
  }

  const draft = parsed.data;
  const currentUser = await getCurrentUser();

  try {
    if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

    const reference = idempotencyKey
      ? idempotentReference(idempotencyKey, currentUser?.id ?? null)
      : `EMP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // A retry with the same idempotency key returns the original committed
    // order and does not touch inventory again.
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({
        where: { reference },
        include: { items: true, address: true, shippingMethod: true },
      });
      if (existing) {
        if (existing.userId && existing.userId !== currentUser?.id) {
          return jsonError('forbidden', 'This idempotency key belongs to another order owner', { status: 403 });
        }
        const response = jsonOk(mapOrder(existing), { status: 200, meta: { source: 'idempotent-replay' } });
        if (!existing.userId) {
          response.cookies.set(guestReceiptCookieName(existing.id), createGuestReceiptToken(existing.id), guestReceiptCookieOptions());
        }
        response.headers.set('Idempotency-Key', idempotencyKey);
        return response;
      }
    }

    let shippingCost = new Prisma.Decimal(0);
    let shippingMethodId: string | null = null;
    if (draft.shippingMethodId || draft.shippingMethodKey) {
      const sm = await prisma.shippingMethod.findFirst({
        where: {
          isActive: true,
          OR: [
            ...(draft.shippingMethodId ? [{ id: draft.shippingMethodId }] : []),
            ...(draft.shippingMethodKey ? [{ key: draft.shippingMethodKey }] : []),
          ],
        },
      });
      if (!sm) return jsonError('unknown_shipping_method', 'Shipping method not available', { status: 422 });
      shippingCost = sm.cost;
      shippingMethodId = sm.id;
    }

    const slugs = draft.items.map((i) => i.slug);
    const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    for (const item of draft.items) {
      const p = bySlug.get(item.slug);
      if (!p) return jsonError('unknown_product', `Unknown product: ${item.slug}`, { status: 422 });
      if (p.isActive === false || p.inStock === false) return jsonError('product_unavailable', `Product not available: ${item.slug}`, { status: 422 });
    }

    const currencies = new Set(products.map((p) => p.currency));
    if (currencies.size !== 1) return jsonError('mixed_currency', 'Products in one order must use the same currency', { status: 422 });
    const orderCurrency = [...currencies][0];
    if (shippingMethodId) {
      const shippingMethod = await prisma.shippingMethod.findUnique({ where: { id: shippingMethodId }, select: { currency: true } });
      if (!shippingMethod || shippingMethod.currency !== orderCurrency) return jsonError('currency_mismatch', 'Shipping method currency does not match the order', { status: 422 });
    }

    const subtotal = draft.items.reduce((s, i) => s.add(bySlug.get(i.slug)!.price.mul(i.quantity)), new Prisma.Decimal(0)).toDecimalPlaces(2);
    const itemCount = draft.items.reduce((s, i) => s + i.quantity, 0);
    const shipping = draft.items.length > 0 ? shippingCost.toDecimalPlaces(2) : new Prisma.Decimal(0);
    const total = subtotal.add(shipping).toDecimalPlaces(2);

    const created = await prisma.$transaction(async (tx) => {
      let addressId: string | null = null;
      let addressSnapshot: {
        fullName: string; phone: string; province: string; district: string; city: string | null;
        addressLine: string; postalCode: string | null; notes: string | null;
      };

      if (draft.addressId) {
        if (!currentUser) throw new OrderCreationError('address_requires_auth', 'An addressId requires an authenticated user');
        const existing = await tx.address.findFirst({ where: { id: draft.addressId, userId: currentUser.id } });
        if (!existing) throw new OrderCreationError('address_not_found', 'Address not found for user');
        addressId = existing.id;
        addressSnapshot = existing;
      } else if (draft.address) {
        const addr = await tx.address.create({ data: { ...draft.address, userId: currentUser?.id ?? null } });
        addressId = addr.id;
        addressSnapshot = addr;
      } else {
        throw new OrderCreationError('address_required', 'No address provided');
      }

      for (const item of draft.items) {
        const p = bySlug.get(item.slug)!;
        const res = await tx.product.updateMany({
          where: { id: p.id, isActive: true, inStock: true, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        });
        if (res.count === 0) throw new OrderCreationError('out_of_stock', `Product out of stock: ${p.slug}`);
      }

      const productIds = draft.items.map((i) => bySlug.get(i.slug)!.id);
      await tx.product.updateMany({ where: { id: { in: productIds }, stockQuantity: { lte: 0 } }, data: { inStock: false } });

      return tx.order.create({
        data: {
          reference,
          status: 'pending',
          paymentMethod: draft.paymentMethod,
          subtotal,
          shipping,
          total,
          currency: orderCurrency,
          itemCount,
          userId: currentUser?.id ?? null,
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
          items: { create: draft.items.map((i) => { const p = bySlug.get(i.slug)!; return { productId: p.id, slug: p.slug, name: p.name, price: p.price, quantity: i.quantity }; }) },
        },
        include: { items: true, address: true, shippingMethod: true },
      });
    });

    const response = jsonOk(mapOrder(created), { status: 201, meta: { source: 'db' } });
    if (idempotencyKey) response.headers.set('Idempotency-Key', idempotencyKey);
    if (!currentUser) response.cookies.set(guestReceiptCookieName(created.id), createGuestReceiptToken(created.id), guestReceiptCookieOptions());
    return response;
  } catch (err) {
    if (err instanceof OrderCreationError) return jsonError(err.code, err.message, { status: err.code === 'out_of_stock' ? 409 : 422 });
    logger.error('orders.create_failed', {}, err);
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code?: string }).code;
      // Concurrent retries can race on the same deterministic reference. The
      // unique reference constraint is authoritative; return the committed
      // order instead of reporting a generic failure.
      if (code === 'P2002' && idempotencyKey) {
        const existing = await prisma.order.findUnique({ where: { reference }, include: { items: true, address: true, shippingMethod: true } });
        if (existing && (!existing.userId || existing.userId === currentUser?.id)) {
          const response = jsonOk(mapOrder(existing), { status: 200, meta: { source: 'idempotent-race-replay' } });
          if (!existing.userId) response.cookies.set(guestReceiptCookieName(existing.id), createGuestReceiptToken(existing.id), guestReceiptCookieOptions());
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
