/**
 * Public shipping methods — Phase 3
 * GET /api/shipping-methods → list of active methods, sorted by sortOrder
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { mapShippingMethod } from '@/lib/db-mappers';

export const dynamic = 'force-dynamic';

export async function OPTIONS() { return jsonPreflight(); }

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'ship:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const rows = await prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    if (rows.length === 0) return jsonOk({ items: [] }, { meta: { source: 'db' } });
    return jsonOk({ items: rows.map(mapShippingMethod) }, { meta: { source: 'db' } });
  } catch (e) {
    console.error('[shipping-methods]', e);
    return jsonError('shipping_methods_failed', 'Unable to load shipping methods', { status: 500 });
  }
}
