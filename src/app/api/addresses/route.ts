/**
 * Addresses API — Phase 3
 *
 * GET  /api/addresses  → list current user's saved addresses
 * POST /api/addresses  → create a new saved address for the current user
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { addressInputSchema } from '@/lib/validation/order';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { getCurrentUser } from '@/lib/auth/current-user';
import { mapAddress } from '@/lib/db-mappers';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'addr:list'), { limit: 60 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Authentication required', { status: 401 });
  if (!isDatabaseConfigured()) return jsonOk({ items: [] }, { meta: { source: 'empty' } });

  const rows = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return jsonOk({ items: rows.map(mapAddress) }, { meta: { source: 'db' } });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'addr:create'), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Authentication required', { status: 401 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Bad JSON', { status: 400 }); }
  const parsed = addressInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid address', { status: 422, details: { issues: parsed.error.issues } });
  }
  const data = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { ...data, userId: user.id, isDefault: !!data.isDefault },
    });
  });
  return jsonOk(mapAddress(created), { status: 201 });
}
