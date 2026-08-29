import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { recordAudit } from '@/lib/audit/log';

export const dynamic = 'force-dynamic';

const statusQuery = z.enum(['all', 'pending', 'approved']).default('all');
const schema = z.object({ isApproved: z.boolean() });

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi('reviews.manage');
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Reviews unavailable', { status: 503 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.get('pageSize') ?? '20', 10) || 20));
  const q = sp.get('q')?.trim() ?? '';
  const status = statusQuery.safeParse(sp.get('status') ?? 'all').data ?? 'all';
  const where = {
    ...(status === 'approved' ? { isApproved: true } : status === 'pending' ? { isApproved: false } : {}),
    ...(q ? { OR: [
      { title: { contains: q, mode: 'insensitive' as const } },
      { comment: { contains: q, mode: 'insensitive' as const } },
      { product: { name: { contains: q, mode: 'insensitive' as const } } },
      { user: { fullName: { contains: q, mode: 'insensitive' as const } } },
    ] } : {}),
  };

  try {
    const [rows, total, pending, approved] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { fullName: true } }, product: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.review.count({ where }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.review.count({ where: { isApproved: true } }),
    ]);
    return jsonOk({ items: rows, total, page, pageSize, counts: { all: pending + approved, pending, approved } });
  } catch {
    return jsonError('query_failed', 'Failed to load reviews', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdminApi('reviews.manage');
  if (!guard.ok) return guard.response;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError('invalid_id', 'Review id is required', { status: 400 });
  const payload = await req.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid review status', { status: 422 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Reviews unavailable', { status: 503 });
  try {
    const before = await prisma.review.findUnique({ where: { id }, select: { isApproved: true } });
    if (!before) return jsonError('not_found', 'Review not found', { status: 404 });
    const after = await prisma.review.update({ where: { id }, data: { isApproved: parsed.data.isApproved }, select: { isApproved: true } });
    await recordAudit({ actor: { id: guard.user.id, role: guard.user.role }, action: 'review.moderation', entityType: 'review', entityId: id, before, after, req });
    return jsonOk(after);
  } catch {
    return jsonError('update_failed', 'Failed to update review', { status: 500 });
  }
}
