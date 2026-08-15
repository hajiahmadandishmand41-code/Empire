import type { NextRequest } from 'next/server';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { listAdminOrders } from '@/features/admin/lib/queries';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.get('pageSize') ?? '10', 10) || 10));
  try {
    const result = await listAdminOrders({
      q: sp.get('q') ?? undefined,
      status: sp.get('status') ?? undefined,
      page,
      pageSize,
    });
    return jsonOk(result, { meta: { source: result.source } });
  } catch (err) {
    logger.error('admin.orders.list_failed', {}, err);
    const isDatabaseErr =
      err instanceof Error && err.message === 'Database not configured';
    return jsonError(
      isDatabaseErr ? 'db_unavailable' : 'query_failed',
      isDatabaseErr ? 'Database is not configured' : 'Failed to fetch orders',
      { status: isDatabaseErr ? 503 : 500 },
    );
  }
}
