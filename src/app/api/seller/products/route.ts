/**
 * Seller Products API
 *
 * GET  /api/seller/products  — List seller's products (paginated)
 * POST /api/seller/products  — Create a new product
 *
 * Architecture:
 *   - Uses ProductService to enforce business rules (category required, etc.)
 *   - Category validation is enforced at the SERVICE level, not here
 *   - Product becomes immediately visible on homepage/shop/category/seller pages
 *   - Slug uniqueness enforced at DB level with clean error mapping
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { listSellerProducts } from '@/features/seller/lib/products';
import { getProductService } from '@/server/infrastructure/registry';
import { ProductServiceError } from '@/server/services/product.service';
import { mapErrorToResponse } from '@/server/infrastructure/errors';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function serializeProduct<T extends object>(row: T) {
  const out = { ...row } as Record<string, unknown>;
  if (out.price != null) out.price = Number(out.price);
  if (out.compareAtPrice != null) out.compareAtPrice = Number(out.compareAtPrice);
  if (out.weightKg != null) out.weightKg = Number(out.weightKg);
  for (const key of ['imagesJson','featuresJson','dimensionsJson','tagsJson','attributesJson'] as const) {
    if (out[key] != null && typeof out[key] !== 'string') out[key] = JSON.stringify(out[key]);
  }
  return out;
}


/**
 * Product creation schema.
 * categoryId is REQUIRED — no product may be created without a category.
 */
const createSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(
    /^[a-z0-9-]+$/,
    'شناسه باید شامل حروف کوچک، اعداد و خط تیره باشد',
  ),
  name: z.string().trim().min(2).max(120),
  shortDescription: z.string().trim().min(2).max(300),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional().nullable(),
  categoryId: z.string().trim().min(1, 'انتخاب دسته‌بندی الزامی است'),
  region: z.string().trim().min(1).default('AF'),
  currency: z.string().trim().min(3).max(3).default('AFN'),
  inStock: z.boolean().default(true),
  isActive: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  description: z.string().optional().nullable(),
  whatsappNumber: z.string().trim().max(40).optional().nullable(),
  videoUrl: z.string().trim().max(500).optional().nullable(),
  isTraditional: z.boolean().default(false),
  weightKg: z.number().min(0).optional().nullable(),
  dimensionsJson: z.string().max(200).optional().nullable(),
  tagsJson: z.string().max(500).optional().nullable(),
  attributesJson: z.string().max(2000).optional().nullable(),
  primaryImageIndex: z.number().int().min(0).default(0).optional(),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.get('pageSize') ?? '10', 10) || 10));
  const q = sp.get('q') ?? undefined;
  const sellerId = guard.user.role === 'admin' ? undefined : guard.user.id;

  const result = await listSellerProducts({ q, page, pageSize, sellerId });
  return jsonOk(result.items, {
    meta: { total: result.total, page: result.page, pageSize: result.pageSize, source: result.source },
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid product payload', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }

  try {
    const svc = getProductService();
    const created = await svc.createProduct({
      ...parsed.data,
      sellerId: guard.user.id,
      compareAtPrice: parsed.data.compareAtPrice ?? null,
      videoUrl: parsed.data.videoUrl ?? null,
      isTraditional: parsed.data.isTraditional ?? false,
    });

    logger.info('seller.product.created', {
      productId: created.id,
      sellerId: guard.user.id,
      slug: parsed.data.slug,
    });

    return jsonOk(serializeProduct(created), { status: 201 });
  } catch (err) {
    if (err instanceof ProductServiceError) {
      return jsonError(err.code, err.message, { status: err.httpStatus });
    }
    logger.error('seller.product.create_failed', { sellerId: guard.user.id }, err);
    return mapErrorToResponse(err);
  }
}
