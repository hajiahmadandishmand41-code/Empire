/** Seller customers API — buyers of the seller's products with spend rollup. */
import type { NextRequest } from 'next/server';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { listSellerCustomers } from '@/features/seller/lib/customer-queries';
import { isDatabaseConfigured } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function OPTIONS() { return jsonPreflight(); }

export async function GET(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') {
    return jsonError('seller_context_required', 'این endpoint فقط برای حساب فروشنده است؛ برای نمای مدیریتی از بخش Admin استفاده کنید.', { status: 403 });
  }
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'پایگاه داده در دسترس نیست.', { status: 503 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(10, Number.parseInt(sp.get('pageSize') ?? '20', 10) || 20));
  const q = sp.get('q')?.trim() ?? '';

  try {
    const result = await listSellerCustomers({ sellerId: guard.user.id, page, pageSize, q });
    return jsonOk(result.rows, { meta: { total: result.totalCustomers, page: result.page, pageSize: result.pageSize, source: 'db' } });
  } catch (error) {
    logger.error('seller.customers.list_failed', { userId: guard.user.id }, error);
    return jsonError('internal_error', 'دریافت مشتریان ناموفق بود.', { status: 500 });
  }
}
