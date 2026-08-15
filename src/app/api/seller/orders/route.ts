import type { NextRequest } from 'next/server';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { listSellerOrders } from '@/features/orders';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.get('pageSize') ?? '10', 10) || 10));

  const result = await listSellerOrders({
    sellerId: guard.user.id,
    page,
    pageSize,
    status: sp.get('status') ?? undefined,
    q: sp.get('q') ?? undefined,
  });

  if (!result) return jsonError('server_error', 'Failed to list orders', { status: 500 });
  return jsonOk(result, { meta: { source: result.source } });
}
