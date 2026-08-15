/** Seller Payments / Transactions API. */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { WalletTxType } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function jsonError(code: string, message: string, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: false, error: code, message }, init);
}

export async function GET(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(5, parseInt(sp.get('limit') ?? '10', 10) || 10));
  const typeParam = sp.get('type');
  const type = typeParam && Object.values(WalletTxType).includes(typeParam as WalletTxType) ? (typeParam as WalletTxType) : undefined;
  const baseWhere = { sellerId: guard.user.id, ...(type ? { type } : {}) };

  try {
    const [transactions, total, incomeAgg, payoutAgg] = await Promise.all([
      prisma.walletTransaction.findMany({ where: baseWhere, orderBy: { createdAt: 'desc' }, take: limit, skip: (page - 1) * limit }),
      prisma.walletTransaction.count({ where: baseWhere }),
      prisma.walletTransaction.aggregate({ where: { sellerId: guard.user.id, type: 'sale' }, _sum: { amount: true } }),
      prisma.walletTransaction.aggregate({ where: { sellerId: guard.user.id, type: 'payout' }, _sum: { amount: true } }),
    ]);
    const totalIncome = incomeAgg._sum.amount == null ? 0 : Number(incomeAgg._sum.amount);
    const totalWithdrawal = Math.abs(payoutAgg._sum.amount == null ? 0 : Number(payoutAgg._sum.amount));
    const balance = totalIncome - totalWithdrawal;
    const safeTransactions = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));
    return NextResponse.json({ ok: true, data: { transactions: safeTransactions, summary: { totalIncome, totalWithdrawal, balance }, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, source: 'db' } });
  } catch (err) {
    logger.error('seller.payments.error', { sellerId: guard.user.id }, err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
