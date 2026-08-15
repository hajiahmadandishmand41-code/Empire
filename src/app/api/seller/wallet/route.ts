import { jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import {
  getWalletSummary,
  listWalletTransactions,
  listSellerPayouts,
} from '@/features/seller/lib/wallet-queries';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  const [summary, transactions, payouts] = await Promise.all([
    getWalletSummary(guard.user.id),
    listWalletTransactions(guard.user.id, 20),
    listSellerPayouts(guard.user.id, 20),
  ]);
  return jsonOk({ summary, transactions, payouts });
}
