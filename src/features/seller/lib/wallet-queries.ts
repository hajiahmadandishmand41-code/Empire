/**
 * Read-side helpers for wallet UI + APIs. Kept separate from
 * `wallet.ts` so pure business logic stays free of pagination/UI concerns.
 */
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { ensureWallet } from '@/lib/finance/wallet';

export interface WalletSummary {
  balance: number;
  totalEarned: number;
  totalPaidOut: number;
  pendingPayoutAmount: number;
  currency: string;
  commissionRate: number;
  source: 'db' | 'empty';
}

export async function getWalletSummary(sellerId: string): Promise<WalletSummary> {
  const empty: WalletSummary = { balance: 0, totalEarned: 0, totalPaidOut: 0, pendingPayoutAmount: 0, currency: 'AFN', commissionRate: 10, source: 'empty' };
  if (!isDatabaseConfigured()) return empty;
  const wallet = await ensureWallet(sellerId);
  const user = await prisma.user.findUnique({ where: { id: sellerId }, select: { commissionRate: true } });
  const pending = await prisma.payout.aggregate({ where: { sellerId, status: { in: ['pending', 'approved'] } }, _sum: { amount: true } });
  return { balance: Number(wallet.balance), totalEarned: Number(wallet.totalEarned), totalPaidOut: Number(wallet.totalPaidOut), pendingPayoutAmount: pending._sum.amount == null ? 0 : Number(pending._sum.amount), currency: wallet.currency, commissionRate: user?.commissionRate == null ? 10 : Number(user.commissionRate), source: 'db' };
}

export async function listWalletTransactions(sellerId: string, limit = 50) {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.walletTransaction.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' }, take: limit });
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function listSellerPayouts(sellerId: string, limit = 50) {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.payout.findMany({ where: { sellerId }, orderBy: { createdAt: 'desc' }, take: limit });
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function listAllPayouts(status?: 'pending' | 'approved' | 'paid' | 'rejected') {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.payout.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: 'desc' }, include: { seller: { select: { id: true, fullName: true, email: true, sellerShopName: true } } }, take: 200 });
  return rows.map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function listAllPayoutsPaged(status: 'pending' | 'approved' | 'paid' | 'rejected' | undefined, page = 1, pageSize = 20) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(10, pageSize));
  if (!isDatabaseConfigured()) return { items: [], total: 0, page: safePage, pageSize: safePageSize };
  const where = status ? { status } : undefined;
  const [rows, total] = await Promise.all([
    prisma.payout.findMany({ where, orderBy: { createdAt: 'desc' }, include: { seller: { select: { id: true, fullName: true, email: true, sellerShopName: true } } }, take: safePageSize, skip: (safePage - 1) * safePageSize }),
    prisma.payout.count({ where }),
  ]);
  return { items: rows.map((row) => ({ ...row, amount: Number(row.amount) })), total, page: safePage, pageSize: safePageSize };
}
