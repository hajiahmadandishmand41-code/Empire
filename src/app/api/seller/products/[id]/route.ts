/**
 * Seller Product Detail API
 *
 * PATCH  /api/seller/products/:id — Update a product
 * DELETE /api/seller/products/:id — Delete a product (or safely deactivate when order history exists)
 *
 * Stage 1 hardening:
 *   - Accept and validate the existing Product.imagesJson contract.
 *   - Validate primaryImageIndex against the submitted image collection.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
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

function imageCollectionHasValidShape(raw: string | null | undefined): boolean {
  if (raw == null || raw.trim() === '') return true;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length > 10) return false;
    return parsed.every((item) => {
      if (typeof item === 'string') return item.trim().length > 0 && item.length <= 1500;
      if (!item || typeof item !== 'object') return false;
      const src = (item as { src?: unknown }).src;
      return typeof src === 'string' && src.trim().length > 0 && src.length <= 1500;
    });
  } catch {
    return false;
  }
}

function imageCount(raw: string | null | undefined): number {
  if (!raw || !imageCollectionHasValidShape(raw)) return 0;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  shortDescription: z.string().trim().min(2).max(300).optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().nullable().optional(),
  inStock: z.boolean().optional(),
  isActive: z.boolean().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  description: z.string().optional().nullable(),
  region: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  whatsappNumber: z.string().trim().max(40).optional().nullable(),
  videoUrl: z.string().trim().max(500).optional().nullable(),
  isTraditional: z.boolean().optional(),
  weightKg: z.number().min(0).optional().nullable(),
  dimensionsJson: z.string().max(200).optional().nullable(),
  tagsJson: z.string().max(500).optional().nullable(),
  attributesJson: z.string().max(2000).optional().nullable(),
  imagesJson: z.string().max(12000).optional().nullable(),
  primaryImageIndex: z.number().int().min(0).optional(),
}).strict().superRefine((value, ctx) => {
  if (!imageCollectionHasValidShape(value.imagesJson)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imagesJson'],
      message: 'فرمت تصاویر محصول نامعتبر است',
    });
    return;
  }
  if (value.imagesJson !== undefined && value.primaryImageIndex !== undefined) {
    const count = imageCount(value.imagesJson);
    if (count > 0 && value.primaryImageIndex >= count) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primaryImageIndex'],
        message: 'شاخص تصویر اصلی خارج از محدوده تصاویر است',
      });
    }
  }
});

export async function OPTIONS() { return jsonPreflight(); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid product patch', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const svc = getProductService();
    const ownership = await svc.checkOwnership(id, guard.user.id, guard.user.role === 'admin');
    if (ownership === 'not_found') return jsonError('not_found', 'Product not found', { status: 404 });
    if (ownership === 'forbidden') return jsonError('forbidden', 'You do not own this product', { status: 403 });
    const updated = await svc.updateProduct(id, parsed.data);
    logger.info('seller.product.updated', {
      productId: id,
      sellerId: guard.user.id,
      fields: Object.keys(parsed.data),
      imageCount: imageCount(parsed.data.imagesJson),
    });
    return jsonOk(serializeProduct(updated));
  } catch (err) {
    if (err instanceof ProductServiceError) return jsonError(err.code, err.message, { status: err.httpStatus });
    logger.error('seller.product.update_failed', { productId: id, sellerId: guard.user.id }, err);
    return mapErrorToResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const svc = getProductService();
    const ownership = await svc.checkOwnership(id, guard.user.id, guard.user.role === 'admin');
    if (ownership === 'not_found') return jsonError('not_found', 'Product not found', { status: 404 });
    if (ownership === 'forbidden') return jsonError('forbidden', 'You do not own this product', { status: 403 });

    // Never physically delete a product that participates in order history.
    // Historical order items must remain queryable and immutable.
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      await prisma.product.update({ where: { id }, data: { isActive: false, inStock: false } });
      logger.info('seller.product.deactivated_after_orders', { productId: id, sellerId: guard.user.id, orderItemCount });
      return jsonOk({ deleted: false, deactivated: true, preservedOrderHistory: true });
    }

    await svc.deleteProduct(id);
    logger.info('seller.product.deleted', { productId: id, sellerId: guard.user.id });
    return jsonOk({ deleted: true, deactivated: false });
  } catch (err) {
    logger.error('seller.product.delete_failed', { productId: id, sellerId: guard.user.id }, err);
    return mapErrorToResponse(err);
  }
}
