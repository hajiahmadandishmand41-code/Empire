import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { updatePayoutStatus, PayoutError } from '@/lib/finance/wallet';
import { recordAudit } from '@/lib/audit/log';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  decision: z.enum(['approved', 'paid', 'rejected']),
  adminNote: z.string().max(500).optional(),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'اطلاعات نامعتبر است.', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }
  try {
    // Snapshot previous state for the audit entry (best-effort — a
    // failure here must not block the decision itself).
    let previousStatus: string | null = null;
    if (isDatabaseConfigured()) {
      const existing = await prisma.payout.findUnique({
        where: { id },
        select: { status: true },
      });
      previousStatus = existing?.status ?? null;
    }

    const payout = await updatePayoutStatus(id, parsed.data.decision, parsed.data.adminNote);

    await recordAudit({
      actor: { id: guard.user.id, role: guard.user.role },
      action: 'payout.decision',
      entityType: 'payout',
      entityId: payout.id,
      before: { status: previousStatus },
      after: { status: payout.status },
      metadata: {
        decision: parsed.data.decision,
        amount: payout.amount.toFixed(2),
        currency: payout.currency,
        sellerId: payout.sellerId,
        adminNote: parsed.data.adminNote ?? null,
      },
      req,
    });

    return jsonOk({ payout: { ...payout, amount: payout.amount.toFixed(2) } });
  } catch (err) {
    if (err instanceof PayoutError) {
      return jsonError(err.code, err.message, {
        status: err.code === 'not_found' ? 404 : 400,
      });
    }
    console.error('[admin/payouts.PATCH]', err);
    return jsonError('update_failed', 'به‌روزرسانی برداشت با خطا مواجه شد.', { status: 500 });
  }
}
