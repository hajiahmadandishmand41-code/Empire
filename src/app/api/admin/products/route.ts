import type { NextRequest } from 'next/server';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { productCreateSchema, productValidationMessage } from '@/features/products/product-contract';
import { getProductService } from '@/server/infrastructure/registry';
import { ProductServiceError } from '@/server/services/product.service';
import { mapErrorToResponse } from '@/server/infrastructure/errors';
import { recordAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function OPTIONS() { return jsonPreflight(); }

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi('products.manage');
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'اتصال پایگاه داده در دسترس نیست.', { status: 503 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return jsonError('invalid_json', 'دادهٔ ارسال‌شده معتبر نیست.', { status: 400 }); }

  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', productValidationMessage(parsed.error.issues), { status: 422, details: { issues: parsed.error.issues } });

  try {
    const created = await getProductService().createProduct({ ...parsed.data, sellerId: null });
    await recordAudit({ actor: { id: guard.user.id, role: guard.accessRole }, action: 'product.create', entityType: 'product', entityId: created.id, before: null, after: created, req });
    return jsonOk(created, { status: 201 });
  } catch (err) {
    if (err instanceof ProductServiceError) return jsonError(err.code, err.message, { status: err.httpStatus });
    logger.error('admin.products.create_failed', { userId: guard.user.id }, err);
    return mapErrorToResponse(err);
  }
}
