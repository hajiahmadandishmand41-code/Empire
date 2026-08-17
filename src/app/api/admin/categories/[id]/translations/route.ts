import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { normalizeCatalogLocale, upsertCategoryLocalizedText } from '@/server/localization/product-localization';
import { logger } from '@/lib/logger';

const schema = z.object({
  locale: z.enum(['fa', 'en', 'ps']),
  name: z.string().trim().min(1).max(200),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) return jsonError('not_found', 'Category not found', { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid translation payload', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const locale = normalizeCatalogLocale(parsed.data.locale);
    await upsertCategoryLocalizedText({ categoryId: id, locale, name: parsed.data.name });
    return jsonOk({ categoryId: id, locale });
  } catch (err) {
    logger.error('admin.category_translation.upsert_failed', { adminId: guard.user.id, categoryId: id }, err);
    return jsonError('translation_upsert_failed', 'Failed to save translation', { status: 500 });
  }
}
