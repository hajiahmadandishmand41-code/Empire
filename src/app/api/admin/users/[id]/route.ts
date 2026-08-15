import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { recordAudit } from '@/lib/audit/log';

export const dynamic = 'force-dynamic';

const patchSchema = z
  .object({
    role: z.enum(['customer', 'seller', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => v.role !== undefined || v.isActive !== undefined, {
    message: 'Provide role or isActive',
  });

export async function OPTIONS() {
  return jsonPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  if (guard.user.id === id) {
    return jsonError(
      'self_modification_forbidden',
      'You cannot change your own role or active state from here',
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid user patch', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const previous = (await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true } as never,
    })) as { id: string; role?: string; isActive?: boolean } | null;
    if (!previous) return jsonError('not_found', 'User not found', { status: 404 });

    // Cast `data` because older generated clients may not yet include
    // the `isActive`/`role` fields (they are added in Phase 9.3 / Phase 10).
    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data as never,
    });
    const raw = updated as unknown as { role?: string; isActive?: boolean };

    // Emit one audit row per distinct sensitive change so ops can
    // filter the timeline by action easily.
    if (parsed.data.role !== undefined && parsed.data.role !== previous.role) {
      await recordAudit({
        actor: { id: guard.user.id, role: guard.user.role },
        action: 'user.role_change',
        entityType: 'user',
        entityId: updated.id,
        before: { role: previous.role },
        after: { role: raw.role },
        req,
      });
    }
    if (parsed.data.isActive !== undefined && parsed.data.isActive !== previous.isActive) {
      await recordAudit({
        actor: { id: guard.user.id, role: guard.user.role },
        action: 'user.active_change',
        entityType: 'user',
        entityId: updated.id,
        before: { isActive: previous.isActive },
        after: { isActive: raw.isActive },
        req,
      });
    }

    return jsonOk({ id: updated.id, role: raw.role, isActive: raw.isActive });
  } catch (err) {
    console.error('[admin/users.PATCH]', err);
    return jsonError('update_failed', 'Failed to update user', { status: 500 });
  }
}
