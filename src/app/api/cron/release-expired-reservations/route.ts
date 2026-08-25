import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { releaseExpiredStockReservations } from '@/lib/orders/order-engine';
import { jsonError, jsonOk } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const configured = process.env.CRON_SECRET?.trim();
  if (!configured) return jsonError('cron_not_configured', 'Cron secret is not configured', { status: 503 });
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${configured}`) return jsonError('forbidden', 'Forbidden', { status: 403 });

  const released = await releaseExpiredStockReservations(prisma);
  return jsonOk({ releasedQuantity: released });
}
