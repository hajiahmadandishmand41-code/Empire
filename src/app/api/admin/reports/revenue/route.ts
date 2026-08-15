import type { NextRequest } from 'next/server';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { getAdminRevenue } from '@/features/admin/lib/queries';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const days = Math.min(180, Math.max(7, parseInt(sp.get('days') ?? '30', 10) || 30));
  try {
    const data = await getAdminRevenue(days);
    return jsonOk(data, { meta: { source: data.source, days } });
  } catch (err) {
    console.error('[api/admin/revenue]', err);
    const isDatabaseErr =
      err instanceof Error && err.message === 'Database not configured';
    return jsonError(
      isDatabaseErr ? 'db_unavailable' : 'query_failed',
      isDatabaseErr ? 'Database is not configured' : 'Failed to fetch revenue report',
      { status: isDatabaseErr ? 503 : 500 },
    );
  }
}
