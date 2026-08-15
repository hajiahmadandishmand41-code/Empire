import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { getAdminStats } from '@/features/admin/lib/queries';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  try {
    const stats = await getAdminStats();
    return jsonOk(stats, { meta: { source: stats.source } });
  } catch (err) {
    console.error('[api/admin/stats]', err);
    const isDatabaseErr =
      err instanceof Error && err.message === 'Database not configured';
    return jsonError(
      isDatabaseErr ? 'db_unavailable' : 'query_failed',
      isDatabaseErr ? 'Database is not configured' : 'Failed to fetch stats',
      { status: isDatabaseErr ? 503 : 500 },
    );
  }
}
