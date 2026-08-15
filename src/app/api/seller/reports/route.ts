import { jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { getSellerReport } from '@/features/seller/lib/reports';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  const report = await getSellerReport(guard.user.id);
  return jsonOk(report);
}
