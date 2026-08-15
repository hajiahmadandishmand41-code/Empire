/**
 * Seller Notifications API — Phase 13
 *
 * GET  /api/seller/notifications  — list notifications
 * PATCH /api/seller/notifications — mark as read
 *
 * Uses Prisma + session auth (requireSellerApi)
 *
 * Stage 6 fix:
 *  - console.error replaced with structured logger throughout.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const sp = req.nextUrl.searchParams;
  const unreadOnly = sp.get('unread') === 'true';
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = 20;

  try {
    const where = {
      sellerId: guard.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.sellerNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.sellerNotification.count({ where }),
      prisma.sellerNotification.count({ where: { sellerId: guard.user.id, isRead: false } }),
    ]);

    return jsonOk({ notifications, unreadCount, total, page, pageSize, source: 'db' });
  } catch (err) {
    logger.error('seller.notifications.get_failed', { sellerId: guard.user.id }, err);
    return jsonOk({ notifications: [], unreadCount: 0, source: 'error' });
  }
}

const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  id: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  if (!isDatabaseConfigured()) {
    return jsonOk({ ok: true });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid payload', { status: 422 });
  }

  try {
    if (parsed.data.id) {
      await prisma.sellerNotification.updateMany({
        where: { id: parsed.data.id, sellerId: guard.user.id },
        data: { isRead: true },
      });
    } else if (parsed.data.ids && parsed.data.ids.length > 0) {
      await prisma.sellerNotification.updateMany({
        where: { id: { in: parsed.data.ids }, sellerId: guard.user.id },
        data: { isRead: true },
      });
    } else {
      await prisma.sellerNotification.updateMany({
        where: { sellerId: guard.user.id, isRead: false },
        data: { isRead: true },
      });
    }
    return jsonOk({ ok: true });
  } catch (err) {
    logger.error('seller.notifications.mark_read_failed', { sellerId: guard.user.id }, err);
    return jsonError('server_error', 'Failed to mark as read', { status: 500 });
  }
}
