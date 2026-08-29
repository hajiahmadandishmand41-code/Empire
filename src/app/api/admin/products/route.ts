import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { adminMediaUrlSchema } from '@/features/admin/lib/media-url';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  slug: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(120),
  shortDescription: z.string().trim().min(2).max(300),
  price: z.number().positive(),
  categoryId: z.string().trim().min(1),
  region: z.string().trim().min(1),
  currency: z.string().trim().min(3).max(3).default('AFN'),
  inStock: z.boolean().default(true),
  badge: z.string().trim().max(40).nullable().optional(),
  description: z.string().optional(),
  imagesJson: z.array(adminMediaUrlSchema).max(12).default([]),
  primaryImageIndex: z.number().int().min(0).max(11).default(0),
});

export async function OPTIONS() { return jsonPreflight(); }

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi('products.manage');
  if (!guard.ok) return guard.response;

  let body: unknown;
  try { body = await req.json(); }
  catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid product payload', { status: 422, details: { issues: parsed.error.issues } });
  if (parsed.data.primaryImageIndex >= parsed.data.imagesJson.length && parsed.data.imagesJson.length > 0) {
    return jsonError('invalid_primary_image', 'Primary image index is out of range', { status: 422 });
  }
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const created = await prisma.product.create({
      data: {
        ...parsed.data,
        primaryImageIndex: parsed.data.imagesJson.length > 0 ? parsed.data.primaryImageIndex : 0,
      },
    });
    return jsonOk(created, { status: 201 });
  } catch (err) {
    logger.error('admin.products.create_failed', { userId: guard.user.id }, err);
    return jsonError('create_failed', 'Failed to create product', { status: 500 });
  }
}
