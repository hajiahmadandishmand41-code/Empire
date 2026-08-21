import type { NextRequest } from 'next/server';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { listAdminUsers } from '@/features/admin/lib/queries';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi('users.view');
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.get('pageSize') ?? '10', 10) || 10));
  try {
    const result = await listAdminUsers({
      q: sp.get('q') ?? undefined,
      page,
      pageSize,
    });
    return jsonOk(result, { meta: { source: result.source } });
  } catch (err) {
    console.error('[api/admin/users]', err);
    const isDatabaseErr = err instanceof Error && err.message === 'Database not configured';
    return jsonError(
      isDatabaseErr ? 'db_unavailable' : 'query_failed',
      isDatabaseErr ? 'Database is not configured' : 'Failed to fetch users',
      { status: isDatabaseErr ? 503 : 500 },
    );
  }
}
