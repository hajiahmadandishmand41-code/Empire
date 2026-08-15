/**
 * Seller Product Detail API
 *
 * PATCH  /api/seller/products/:id — Update a product
 * DELETE /api/seller/products/:id — Delete a product
 *
 * Architecture:
 *   - Ownership verification via ProductService.checkOwnership()
 *   - Business rules in ProductService (category validation on change)
 *   - inStock/badge auto-sync on stock/price changes
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { isDatabaseConfigured } from '@/lib/db';
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


const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    shortDescription: z.string().trim().min(2).max(300).optional(),
    price: z.number().positive().optional(),
    compareAtPrice: z.number().positive().nullable().optional(),
    inStock: z.boolean().optional(),
    isActive: z.boolean().optional(),
    stockQuantity: z.number().int().min(0).optional(),
    description: z.string().optional().nullable(),
    region: z.string().trim().min(1).optional(),
    /**
     * categoryId is optional on update — but if provided, it MUST exist.
     * Validation is enforced in ProductService.updateProduct().
     */
    categoryId: z.string().trim().min(1).optional(),
    whatsappNumber: z.string().trim().max(40).optional().nullable(),
    videoUrl: z.string().trim().max(500).optional().nullable(),
    isTraditional: z.boolean().optional(),
    weightKg: z.number().min(0).optional().nullable(),
    dimensionsJson: z.string().max(200).optional().nullable(),
    tagsJson: z.string().max(500).optional().nullable(),
    attributesJson: z.string().max(2000).optional().nullable(),
    primaryImageIndex: z.number().int().min(0).optional(),
  })
  .strict();

export async function OPTIONS() {
  return jsonPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid product patch', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }

  try {
    const svc = getProductService();

    // Verify ownership — sellers can only edit their own products; admins can edit any.
    const ownership = await svc.checkOwnership(
      id,
      guard.user.id,
      guard.user.role === 'admin',
    );
    if (ownership === 'not_found') {
      return jsonError('not_found', 'Product not found', { status: 404 });
    }
    if (ownership === 'forbidden') {
      return jsonError('forbidden', 'You do not own this product', { status: 403 });
    }

    const updated = await svc.updateProduct(id, parsed.data);

    logger.info('seller.product.updated', {
      productId: id,
      sellerId: guard.user.id,
      fields: Object.keys(parsed.data),
    });

    return jsonOk(serializeProduct(updated));
  } catch (err) {
    if (err instanceof ProductServiceError) {
      return jsonError(err.code, err.message, { status: err.httpStatus });
    }
    logger.error('seller.product.update_failed', { productId: id, sellerId: guard.user.id }, err);
    return mapErrorToResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }

  try {
    const svc = getProductService();

    const ownership = await svc.checkOwnership(
      id,
      guard.user.id,
      guard.user.role === 'admin',
    );
    if (ownership === 'not_found') {
      return jsonError('not_found', 'Product not found', { status: 404 });
    }
    if (ownership === 'forbidden') {
      return jsonError('forbidden', 'You do not own this product', { status: 403 });
    }

    await svc.deleteProduct(id);

    logger.info('seller.product.deleted', { productId: id, sellerId: guard.user.id });

    return jsonOk({ deleted: true });
  } catch (err) {
    logger.error('seller.product.delete_failed', { productId: id, sellerId: guard.user.id }, err);
    return mapErrorToResponse(err);
  }
}
