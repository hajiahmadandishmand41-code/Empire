import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
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
  badge: z.string().trim().max(40).optional(),
  description: z.string().optional(),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

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
  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }
  try {
    const created = await prisma.product.create({ data: parsed.data });
    return jsonOk(created, { status: 201 });
  } catch (err) {
    logger.error('admin.products.create_failed', { userId: guard.user.id }, err);
    return jsonError('create_failed', 'Failed to create product', { status: 500 });
  }
}
