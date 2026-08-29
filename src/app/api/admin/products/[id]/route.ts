import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { recordAudit } from '@/lib/audit/log';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { adminMediaUrlSchema } from '@/features/admin/lib/media-url';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(), shortDescription: z.string().trim().min(2).max(300).optional(), price: z.number().positive().optional(), inStock: z.boolean().optional(), badge: z.string().trim().max(40).nullable().optional(), description: z.string().optional(), region: z.string().trim().min(1).optional(), categoryId: z.string().trim().min(1).optional(), stockQuantity: z.number().int().min(0).optional(), isActive: z.boolean().optional(), imagesJson: z.array(adminMediaUrlSchema).max(12).optional(), primaryImageIndex: z.number().int().min(0).max(11).optional(),
}).strict();

function normalizeImageUrls(raw: unknown): string[] {
  if (raw == null) return [];
  let value: unknown = raw;
  if (typeof raw === 'string') { try { value = JSON.parse(raw); } catch { return []; } }
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (item && typeof item === 'object' && 'src' in item) { const src = (item as { src?: unknown }).src; return typeof src === 'string' ? [src] : []; }
    if (item && typeof item === 'object' && 'url' in item) { const url = (item as { url?: unknown }).url; return typeof url === 'string' ? [url] : []; }
    return [];
  });
}

export async function OPTIONS() { return jsonPreflight(); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireAdminApi('products.manage');
  if (!g.ok) return g.response;
  let body: unknown; try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const p = patchSchema.safeParse(body);
  if (!p.success) return jsonError('invalid_body', 'Invalid product patch', { status: 422, details: { issues: p.error.issues } });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const before = await prisma.product.findUnique({ where: { id } });
    if (!before) return jsonError('not_found', 'Product not found', { status: 404 });
    const nextImages = p.data.imagesJson ?? normalizeImageUrls(before.imagesJson);
    const nextPrimary = p.data.primaryImageIndex ?? before.primaryImageIndex;
    if (nextImages.length === 0 && nextPrimary !== 0) return jsonError('invalid_primary_image', 'Primary image index must be 0 when there are no images', { status: 422 });
    if (nextImages.length > 0 && nextPrimary >= nextImages.length) return jsonError('invalid_primary_image', 'Primary image index is out of range', { status: 422 });
    const after = await prisma.product.update({ where: { id }, data: { ...p.data, imagesJson: nextImages, primaryImageIndex: nextImages.length > 0 ? nextPrimary : 0 } });
    await recordAudit({ actor: { id: g.user.id, role: g.accessRole }, action: 'product.update', entityType: 'product', entityId: id, before, after, req });
    return jsonOk(after);
  } catch { return jsonError('update_failed', 'Failed to update product', { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireAdminApi('products.manage');
  if (!g.ok) return g.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true, isActive: true, inStock: true } });
    if (!product) return jsonError('not_found', 'Product not found', { status: 404 });
    const orderCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      const after = await prisma.product.update({ where: { id }, data: { isActive: false, inStock: false } });
      await recordAudit({ actor: { id: g.user.id, role: g.accessRole }, action: 'product.archive', entityType: 'product', entityId: id, before: product, after, metadata: { orderCount }, req });
      return jsonOk({ deleted: false, archived: true, reason: 'product_has_order_history' });
    }
    await prisma.product.delete({ where: { id } });
    await recordAudit({ actor: { id: g.user.id, role: g.accessRole }, action: 'product.delete', entityType: 'product', entityId: id, before: product, after: null, req });
    return jsonOk({ deleted: true });
  } catch { return jsonError('delete_failed', 'Failed to delete product', { status: 500 }); }
}
