/** Seller Products API */
import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { listSellerProducts } from '@/features/seller/lib/products';
import { productCreateSchema, productValidationMessage, parseProductImages } from '@/features/products/product-contract';
import { getProductService } from '@/server/infrastructure/registry';
import { ProductServiceError } from '@/server/services/product.service';
import { mapErrorToResponse } from '@/server/infrastructure/errors';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
function serializeProduct<T extends object>(row: T) { const out = { ...row } as Record<string, unknown>; if (out.price != null) out.price = Number(out.price); if (out.compareAtPrice != null) out.compareAtPrice = Number(out.compareAtPrice); if (out.weightKg != null) out.weightKg = Number(out.weightKg); out.images = parseProductImages(out.imagesJson); delete out.imagesJson; for (const key of ['featuresJson','dimensionsJson','tagsJson','attributesJson'] as const) if (out[key] != null && typeof out[key] !== 'string') out[key] = JSON.stringify(out[key]); return out; }
async function validateSellerBrand(sellerId: string, brandId: string | null | undefined) { if (!brandId) return null; const rows = await prisma.$queryRaw<Array<{ id: string; name: string; slug: string }>>(Prisma.sql`SELECT "id","name","slug" FROM "SellerBrand" WHERE "id"=${brandId} AND "sellerId"=${sellerId} AND "isActive"=true LIMIT 1`); return rows[0] ?? null; }
export async function OPTIONS() { return jsonPreflight(); }
export async function GET(req: NextRequest) { const guard = await requireSellerApi(); if (!guard.ok) return guard.response; const sp = req.nextUrl.searchParams; const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1); const pageSize = Math.min(50, Math.max(5, parseInt(sp.get('pageSize') ?? '10', 10) || 10)); const q = sp.get('q') ?? undefined; const sellerId = guard.user.role === 'admin' ? undefined : guard.user.id; try { const result = await listSellerProducts({ q, page, pageSize, sellerId }); return jsonOk(result.items, { meta: { total: result.total, page: result.page, pageSize: result.pageSize, source: result.source } }); } catch (err) { logger.error('seller.products.list_failed', { userId: guard.user.id }, err); return mapErrorToResponse(err); } }
export async function POST(req: NextRequest) {
  const guard = await requireSellerApi(); if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'اتصال پایگاه داده در دسترس نیست.', { status: 503 });
  let body: unknown; try { body = await req.json(); } catch { return jsonError('invalid_json', 'دادهٔ ارسال‌شده معتبر نیست.', { status: 400 }); }
  const parsed = productCreateSchema.safeParse(body); if (!parsed.success) return jsonError('invalid_body', productValidationMessage(parsed.error.issues), { status: 422, details: { issues: parsed.error.issues } });
  const { brandId = null, ...productInput } = parsed.data;
  if (guard.user.role === 'seller' && !(await validateSellerBrand(guard.user.id, brandId))) return jsonError('invalid_brand', 'برند انتخاب‌شده متعلق به این فروشگاه نیست یا فعال نیست.', { status: 422 });
  try {
    const created = await getProductService().createProduct({ ...productInput, sellerId: guard.user.id });
    if (brandId) await prisma.$executeRaw(Prisma.sql`UPDATE "Product" SET "brandId"=${brandId} WHERE "id"=${created.id} AND "sellerId"=${guard.user.id}`);
    logger.info('seller.product.created', { productId: created.id, sellerId: guard.user.id, brandId: brandId ?? undefined, slug: created.slug, imageCount: parsed.data.images.length });
    return jsonOk({ ...serializeProduct(created), brandId }, { status: 201 });
  } catch (err) { if (err instanceof ProductServiceError) return jsonError(err.code, err.message, { status: err.httpStatus }); logger.error('seller.product.create_failed', { sellerId: guard.user.id }, err); return mapErrorToResponse(err); }
}
