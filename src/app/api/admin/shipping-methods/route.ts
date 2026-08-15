/**
 * Admin shipping methods — Phase 3
 * GET  /api/admin/shipping-methods  → list all (active + inactive)
 * POST /api/admin/shipping-methods  → create
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { shippingMethodInputSchema } from '@/lib/validation/order';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { mapShippingMethod } from '@/lib/db-mappers';

export const dynamic = 'force-dynamic';

export async function OPTIONS() { return jsonPreflight(); }

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonOk({ items: [] });

  const rows = await prisma.shippingMethod.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  return jsonOk({ items: rows.map(mapShippingMethod) });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'DB not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Bad JSON', { status: 400 }); }
  const parsed = shippingMethodInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid shipping method', { status: 422, details: { issues: parsed.error.issues } });
  }
  const exists = await prisma.shippingMethod.findUnique({ where: { key: parsed.data.key } });
  if (exists) return jsonError('duplicate_key', 'A method with this key already exists', { status: 409 });

  const created = await prisma.shippingMethod.create({ data: parsed.data });
  return jsonOk(mapShippingMethod(created), { status: 201 });
}
