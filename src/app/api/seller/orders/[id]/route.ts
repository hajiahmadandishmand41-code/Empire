import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { getOrderForViewer } from '@/features/orders';

export const dynamic = 'force-dynamic';

const idSchema = z.string().trim().min(1).max(80);

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return jsonError('invalid_id', 'Invalid order id', { status: 400 });

  const detail = await getOrderForViewer(parsed.data, {
    id: guard.user.id,
    role: guard.user.role,
  });
  if (!detail) return jsonError('not_found', 'Order not found', { status: 404 });
  return jsonOk(detail.order);
}
