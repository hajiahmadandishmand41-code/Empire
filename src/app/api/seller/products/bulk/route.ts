import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';

export const dynamic = 'force-dynamic';

const itemSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(120),
  shortDescription: z.string().trim().min(2).max(300),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  categoryId: z.string().trim().min(1),
  region: z.string().trim().min(1).max(20).default('AF'),
  currency: z.string().trim().length(3).default('AFN'),
  inStock: z.boolean().default(true),
  isActive: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  description: z.string().nullable().optional(),
  whatsappNumber: z.string().trim().max(40).nullable().optional(),
  videoUrl: z.string().trim().max(500).nullable().optional(),
  isTraditional: z.boolean().default(false),
  weightKg: z.number().min(0).nullable().optional(),
  dimensionsJson: z.string().max(200).nullable().optional(),
  tagsJson: z.string().max(500).nullable().optional(),
  attributesJson: z.string().max(2000).nullable().optional(),
});

const bulkSchema = z.object({ items: z.array(itemSchema).min(1).max(100) });

function jsonOrNull(raw: string | null | undefined) {
  if (!raw || raw.trim() === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON product field');
  }
}

export async function OPTIONS() {
  return jsonPreflight();
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

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid bulk product payload', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }

  const items = parsed.data.items;
  const slugs = items.map((item) => item.slug);
  if (new Set(slugs).size !== slugs.length) {
    return jsonError('duplicate_slug', 'Duplicate slug inside batch', { status: 409 });
  }

  const categoryIds = [...new Set(items.map((item) => item.categoryId))];
  const [categories, existing] = await Promise.all([
    prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } }),
    prisma.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true } }),
  ]);

  const categorySet = new Set(categories.map((c) => c.id));
  const missingCategory = items.find((item) => !categorySet.has(item.categoryId));
  if (missingCategory) {
    return jsonError('category_not_found', `Category not found: ${missingCategory.categoryId}`, { status: 422 });
  }

  if (existing.length) {
    return jsonError('slug_exists', 'One or more slugs already exist', {
      status: 409,
      details: { slugs: existing.map((row) => row.slug) },
    });
  }

  try {
    const result = await prisma.product.createMany({
      data: items.map((item) => ({
        slug: item.slug,
        name: item.name,
        shortDescription: item.shortDescription,
        description: item.description ?? null,
        price: item.price,
        compareAtPrice: item.compareAtPrice ?? null,
        categoryId: item.categoryId,
        sellerId: guard.user.id,
        region: item.region,
        currency: item.currency,
        inStock: item.inStock,
        isActive: item.isActive,
        stockQuantity: item.stockQuantity,
        whatsappNumber: item.whatsappNumber ?? null,
        videoUrl: item.videoUrl ?? null,
        isTraditional: item.isTraditional,
        weightKg: item.weightKg ?? null,
        dimensionsJson: jsonOrNull(item.dimensionsJson),
        tagsJson: jsonOrNull(item.tagsJson),
        attributesJson: jsonOrNull(item.attributesJson),
        badge: item.compareAtPrice != null ? 'sale' : null,
      })),
      skipDuplicates: false,
    });

    return jsonOk({ created: result.count, sellerId: guard.user.id }, { status: 201 });
  } catch (err) {
    console.error('[seller/products/bulk] create failed', err);
    return jsonError('bulk_create_failed', 'Bulk product creation failed', { status: 500 });
  }
}
