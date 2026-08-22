import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { recordAudit } from '@/lib/audit/log';

export const dynamic = 'force-dynamic';

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().trim().max(500).optional(),
}).strict();

export async function OPTIONS() {
  return jsonPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid application action', { status: 422, details: { issues: parsed.error.issues } });
  }

  const application = await prisma.sellerApplication.findUnique({ where: { id } });
  if (!application) return jsonError('not_found', 'Seller application not found', { status: 404 });
  if (application.status !== 'pending') return jsonError('already_reviewed', 'This application has already been reviewed', { status: 409 });
  if (parsed.data.action === 'reject' && !parsed.data.rejectionReason) {
    return jsonError('rejection_reason_required', 'Please provide a rejection reason', { status: 422 });
  }

  const approved = parsed.data.action === 'approve';
  const reviewedAt = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.sellerApplication.update({
      where: { id },
      data: {
        status: approved ? 'approved' : 'rejected',
        rejectionReason: approved ? null : parsed.data.rejectionReason!,
        reviewedById: guard.user.id,
        reviewedAt,
      },
    });
    await tx.user.update({
      where: { id: application.userId },
      data: approved
        ? {
            role: 'seller',
            sellerStatus: 'approved',
            sellerShopName: application.shopName,
            sellerBio: application.description,
            sellerContactPhone: application.phone,
            sellerAddress: application.address,
          }
        : { role: 'customer', sellerStatus: 'rejected' },
    });
    return updatedApplication;
  });

  await recordAudit({
    actor: { id: guard.user.id, role: guard.user.role },
    action: 'seller.status_change',
    entityType: 'seller',
    entityId: application.userId,
    before: { applicationId: application.id, status: application.status },
    after: { applicationId: result.id, status: result.status },
    metadata: { source: 'seller-application-review' },
    req,
  });

  return jsonOk({ id: result.id, status: result.status, reviewedAt: reviewedAt.toISOString() });
}
