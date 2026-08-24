import type { NextRequest } from 'next/server';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { getSellerService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

export async function OPTIONS() { return jsonPreflight(); }

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'sellers:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Seller catalog is unavailable', { status: 503 });
  try {
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1));
    const pageSize = Math.min(48, Math.max(1, Number(req.nextUrl.searchParams.get('pageSize') ?? 48)));
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    const result = await getSellerService().listPublic({ q, page, pageSize });
    return jsonOk(result.items, { meta: { total: result.total, page: result.page, pageSize: result.pageSize, hasMore: result.hasMore } });
  } catch (error) {
    console.error('[api/sellers]', error);
    return jsonError('internal_error', 'Failed to fetch sellers', { status: 500 });
  }
}
