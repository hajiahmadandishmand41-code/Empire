import type { NextRequest } from 'next/server';
import { jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { listAllPayouts } from '@/features/seller/lib/wallet-queries';

export const dynamic = 'force-dynamic';

const statusEnum = z.enum(['pending', 'approved', 'paid', 'rejected']);

export async function OPTIONS() { return jsonPreflight(); }

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi('payouts.view');
  if (!guard.ok) return guard.response;
  const url = new URL(req.url);
  const rawStatus = url.searchParams.get('status');
  const parsed = rawStatus ? statusEnum.safeParse(rawStatus) : null;
  const status = parsed && parsed.success ? parsed.data : undefined;
  const payouts = await listAllPayouts(status);
  return jsonOk({ payouts });
}
