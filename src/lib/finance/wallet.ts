import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}
function decimal(value: Prisma.Decimal | string): Prisma.Decimal { return new Prisma.Decimal(value); }

export interface SplitBreakdown { gross: Prisma.Decimal; commission: Prisma.Decimal; sellerAmount: Prisma.Decimal; commissionRate: Prisma.Decimal; }
export function computeSplit(grossInput: Prisma.Decimal | string, commissionRateInput: Prisma.Decimal | string): SplitBreakdown {
  const gross = decimal(grossInput).toDecimalPlaces(2);
  const rawRate = decimal(commissionRateInput), zero = new Prisma.Decimal(0), hundred = new Prisma.Decimal(100);
  const rate = rawRate.lessThan(zero) ? zero : rawRate.greaterThan(hundred) ? hundred : rawRate;
  const commission = gross.mul(rate).div(hundred).toDecimalPlaces(2);
  return { gross, commission, sellerAmount: gross.sub(commission).toDecimalPlaces(2), commissionRate: rate };
}
export async function ensureWallet(sellerId: string, currency = 'AFN') {
  return prisma.sellerWallet.upsert({ where: { sellerId }, update: {}, create: { sellerId, currency, balance: new Prisma.Decimal(0) } });
}

type SellerOrderRow = { id: string; orderId: string; sellerId: string; commissionRate: Prisma.Decimal; currency: string };
async function loadSellerOrders(orderId: string): Promise<SellerOrderRow[]> {
  return prisma.$queryRaw<SellerOrderRow[]>(Prisma.sql`SELECT "id", "orderId", "sellerId", "commissionRate", "currency" FROM "SellerOrder" WHERE "orderId" = ${orderId}`);
}

type WalletTxClient = Prisma.TransactionClient;

export async function creditSellerOrderTx(tx: WalletTxClient, sellerOrderId: string): Promise<number> {
  const rows = await tx.$queryRaw<SellerOrderRow[]>(Prisma.sql`
    SELECT "id", "orderId", "sellerId", "commissionRate", "currency"
    FROM "SellerOrder" WHERE "id" = ${sellerOrderId} FOR UPDATE
  `);
  const sellerOrder = rows[0];
  if (!sellerOrder) return 0;
  const items = await tx.orderItem.findMany({
    where: { orderId: sellerOrder.orderId, product: { sellerId: sellerOrder.sellerId } },
    select: { id: true, price: true, quantity: true },
  });
  let created = 0;
  for (const item of items) {
    const dedupeKey = `sale:${item.id}`;
    if (await tx.walletTransaction.findUnique({ where: { dedupeKey } })) continue;
    const wallet = await tx.sellerWallet.upsert({ where: { sellerId: sellerOrder.sellerId }, update: {}, create: { sellerId: sellerOrder.sellerId, currency: sellerOrder.currency } });
    if (wallet.currency !== sellerOrder.currency) throw new Error(`WALLET_CURRENCY_MISMATCH:${wallet.currency}:${sellerOrder.currency}`);
    const split = computeSplit(item.price.mul(item.quantity), sellerOrder.commissionRate);
    await tx.walletTransaction.create({ data: { walletId: wallet.id, sellerId: sellerOrder.sellerId, type: 'sale', amount: split.sellerAmount, currency: sellerOrder.currency, orderItemId: item.id, orderId: sellerOrder.orderId, dedupeKey, description: `Sale ${item.id.slice(0, 8)} — gross ${split.gross} ${sellerOrder.currency}, commission ${split.commission} (${split.commissionRate}%)` } });
    await tx.sellerWallet.update({ where: { id: wallet.id }, data: { balance: { increment: split.sellerAmount }, totalEarned: { increment: split.sellerAmount } } });
    created += 1;
  }
  return created;
}

export async function reverseSellersForOrderTx(tx: WalletTxClient, orderId: string): Promise<number> {
  const credits = await tx.walletTransaction.findMany({ where: { orderId, type: 'sale' }, orderBy: { createdAt: 'asc' } });
  let reversed = 0;
  for (const credit of credits) {
    if (!credit.orderItemId) continue;
    const dedupeKey = `refund:${credit.orderItemId}`;
    if (await tx.walletTransaction.findUnique({ where: { dedupeKey } })) continue;
    const debited = await tx.sellerWallet.updateMany({ where: { id: credit.walletId, balance: { gte: credit.amount } }, data: { balance: { decrement: credit.amount }, totalEarned: { decrement: credit.amount } } });
    if (debited.count !== 1) throw new Error('WALLET_REFUND_INSUFFICIENT_BALANCE');
    await tx.walletTransaction.create({ data: { walletId: credit.walletId, sellerId: credit.sellerId, type: 'refund', amount: credit.amount.neg(), currency: credit.currency, orderItemId: credit.orderItemId, orderId: credit.orderId, dedupeKey, description: `Refund ${credit.orderId?.slice(0, 8) ?? ''}` } });
    reversed += 1;
  }
  return reversed;
}

export async function creditSellerOrder(sellerOrderId: string): Promise<number> {
  try { return await prisma.$transaction((tx) => creditSellerOrderTx(tx, sellerOrderId), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
  catch (err) { if (isUniqueViolation(err)) return 0; throw err; }
}
export async function creditSellersForOrder(orderId: string): Promise<number> {
  let created = 0;
  for (const sellerOrder of await loadSellerOrders(orderId)) created += await creditSellerOrder(sellerOrder.id);
  return created;
}
export async function reverseSellersForOrder(orderId: string): Promise<number> {
  try { return await prisma.$transaction((tx) => reverseSellersForOrderTx(tx, orderId), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
  catch (err) { if (isUniqueViolation(err)) return 0; throw err; }
}

export interface PayoutInput { amount: Prisma.Decimal | string; method: 'bank_transfer' | 'cash' | 'whatsapp' | 'atoma_pay'; accountInfo: string; sellerNote?: string; requestKey?: string; }
export async function requestPayout(sellerId: string, input: PayoutInput) {
  let amount: Prisma.Decimal;
  try { amount = decimal(input.amount).toDecimalPlaces(2); } catch { throw new PayoutError('invalid_amount', 'مبلغ برداشت نامعتبر است.'); }
  if (amount.lessThanOrEqualTo(0)) throw new PayoutError('invalid_amount', 'مبلغ برداشت باید بزرگ‌تر از صفر باشد.');
  try {
    return await prisma.$transaction(async (tx) => {
      if (input.requestKey) {
        const existing = await tx.$queryRaw<Array<{ id: string; sellerId: string }>>(Prisma.sql`SELECT "id", "sellerId" FROM "Payout" WHERE "requestKey" = ${input.requestKey} FOR UPDATE`);
        if (existing[0]) {
          if (existing[0].sellerId !== sellerId) throw new PayoutError('idempotency_conflict', 'Idempotency key is already in use.');
          return tx.payout.findUniqueOrThrow({ where: { id: existing[0].id } });
        }
      }
      const wallet = await tx.sellerWallet.upsert({ where: { sellerId }, update: {}, create: { sellerId } });
      const debit = await tx.sellerWallet.updateMany({ where: { sellerId, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
      if (debit.count === 0) throw new PayoutError('insufficient_funds', 'موجودی کیف پول برای این برداشت کافی نیست.');
      const reference = `PO-${randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase()}`;
      const payoutRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`INSERT INTO "Payout" ("id","reference","sellerId","amount","currency","method","status","accountInfo","sellerNote","requestKey") VALUES (${randomUUID()}, ${reference}, ${sellerId}, ${amount}, ${wallet.currency}, ${input.method}, 'pending', ${input.accountInfo}, ${input.sellerNote ?? null}, ${input.requestKey ?? null}) RETURNING "id"`);
      const payoutId = payoutRows[0]?.id;
      if (!payoutId) throw new PayoutError('payout_failed', 'ثبت درخواست برداشت انجام نشد.');
      const payout = await tx.payout.findUniqueOrThrow({ where: { id: payoutId } });
      await tx.walletTransaction.create({ data: { walletId: wallet.id, sellerId, type: 'payout', amount: amount.neg(), currency: wallet.currency, payoutId: payout.id, dedupeKey: `payout:${payout.id}`, description: `Payout request ${reference}` } });
      return payout;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (err) {
    if (isUniqueViolation(err) && input.requestKey) {
      const existing = await prisma.$queryRaw<Array<{ id: string; sellerId: string }>>(Prisma.sql`SELECT "id", "sellerId" FROM "Payout" WHERE "requestKey" = ${input.requestKey} LIMIT 1`);
      if (existing[0]?.sellerId === sellerId) return prisma.payout.findUniqueOrThrow({ where: { id: existing[0].id } });
      if (existing[0]) throw new PayoutError('idempotency_conflict', 'Idempotency key is already in use.');
    }
    throw err;
  }
}

export type PayoutDecision = 'approved' | 'paid' | 'rejected';
export async function updatePayoutStatus(payoutId: string, decision: PayoutDecision, adminNote?: string) {
  return prisma.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new PayoutError('not_found', 'درخواست برداشت یافت نشد.');
    if (payout.status === decision) return payout;
    if (payout.status === 'paid') throw new PayoutError('already_paid', 'این برداشت قبلاً پرداخت شده است.');
    if (payout.status === 'rejected' && decision !== 'rejected') throw new PayoutError('already_rejected', 'این درخواست قبلاً رد شده است.');
    const allowed: Record<string, PayoutDecision[]> = { pending: ['approved', 'rejected'], approved: ['paid', 'rejected'], rejected: ['rejected'], paid: ['paid'] };
    if (!allowed[payout.status]?.includes(decision)) throw new PayoutError('invalid_transition', 'تغییر وضعیت برداشت مجاز نیست.');
    const transitioned = await tx.payout.updateMany({ where: { id: payoutId, status: payout.status }, data: { status: decision, adminNote: adminNote ?? payout.adminNote, processedAt: ['approved', 'paid', 'rejected'].includes(decision) ? new Date() : payout.processedAt } });
    if (transitioned.count === 0) throw new PayoutError('conflict', 'وضعیت این برداشت هم‌زمان تغییر کرد. صفحه را تازه کنید.');
    if (decision === 'paid') await tx.sellerWallet.update({ where: { sellerId: payout.sellerId }, data: { totalPaidOut: { increment: payout.amount } } });
    if (decision === 'rejected') {
      const wallet = await tx.sellerWallet.upsert({ where: { sellerId: payout.sellerId }, update: {}, create: { sellerId: payout.sellerId, currency: payout.currency } });
      const existingReversal = await tx.walletTransaction.findUnique({ where: { dedupeKey: `payout_reversal:${payout.id}` } });
      if (!existingReversal) {
        await tx.walletTransaction.create({ data: { walletId: wallet.id, sellerId: payout.sellerId, type: 'payout_reversal', amount: payout.amount, currency: payout.currency, payoutId: payout.id, dedupeKey: `payout_reversal:${payout.id}`, description: `Payout reversal ${payout.reference}` } });
        await tx.sellerWallet.update({ where: { id: wallet.id }, data: { balance: { increment: payout.amount } } });
      }
    }
    return tx.payout.findUniqueOrThrow({ where: { id: payoutId } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export class PayoutError extends Error { constructor(public code: string, message: string) { super(message); } }
