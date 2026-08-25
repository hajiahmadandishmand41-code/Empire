/**
 * Empire Shop — Seller finance core.
 * Server-only. All wallet arithmetic is Decimal-only and every mutation is
 * paired with an immutable, idempotent ledger row.
 */
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

function decimal(value: Prisma.Decimal | string): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export interface SplitBreakdown {
  gross: Prisma.Decimal;
  commission: Prisma.Decimal;
  sellerAmount: Prisma.Decimal;
  commissionRate: Prisma.Decimal;
}

export function computeSplit(grossInput: Prisma.Decimal | string, commissionRateInput: Prisma.Decimal | string): SplitBreakdown {
  const gross = decimal(grossInput).toDecimalPlaces(2);
  const rawRate = decimal(commissionRateInput);
  const zero = new Prisma.Decimal(0);
  const hundred = new Prisma.Decimal(100);
  const rate = rawRate.lessThan(zero) ? zero : rawRate.greaterThan(hundred) ? hundred : rawRate;
  const commission = gross.mul(rate).div(hundred).toDecimalPlaces(2);
  const sellerAmount = gross.sub(commission).toDecimalPlaces(2);
  return { gross, commission, sellerAmount, commissionRate: rate };
}

export async function ensureWallet(sellerId: string, currency = 'AFN') {
  return prisma.sellerWallet.upsert({ where: { sellerId }, update: {}, create: { sellerId, currency, balance: new Prisma.Decimal(0) } });
}

type SellerOrderRow = { id: string; sellerId: string; commissionRate: Prisma.Decimal; currency: string };

async function loadSellerOrders(orderId: string, sellerId?: string): Promise<SellerOrderRow[]> {
  return prisma.$queryRaw<SellerOrderRow[]>(Prisma.sql`
    SELECT "id", "sellerId", "commissionRate", "currency"
    FROM "SellerOrder"
    WHERE "orderId" = ${orderId}
      ${sellerId ? Prisma.sql`AND "sellerId" = ${sellerId}` : Prisma.empty}
  `);
}

/** Credit one delivered SellerOrder only. Safe for multi-seller partial delivery. */
export async function creditSellerOrder(sellerOrderId: string): Promise<number> {
  const sellerRows = await prisma.$queryRaw<SellerOrderRow[]>(Prisma.sql`
    SELECT "id", "sellerId", "commissionRate", "currency"
    FROM "SellerOrder" WHERE "id" = ${sellerOrderId} LIMIT 1
  `);
  const sellerOrder = sellerRows[0];
  if (!sellerOrder) return 0;

  const items = await prisma.orderItem.findMany({
    where: { orderId: (await prisma.$queryRaw<Array<{ orderId: string }>>(Prisma.sql`SELECT "orderId" FROM "SellerOrder" WHERE "id" = ${sellerOrderId} LIMIT 1`))[0]?.orderId ?? '', product: { sellerId: sellerOrder.sellerId } },
    include: { product: { select: { sellerId: true } } },
  });

  let created = 0;
  for (const item of items) {
    const dedupeKey = `sale:${item.id}`;
    try {
      await prisma.$transaction(async (tx) => {
        const exists = await tx.walletTransaction.findUnique({ where: { dedupeKey } });
        if (exists) return;
        const wallet = await tx.sellerWallet.upsert({ where: { sellerId: sellerOrder.sellerId }, update: {}, create: { sellerId: sellerOrder.sellerId, currency: sellerOrder.currency } });
        if (wallet.currency !== sellerOrder.currency) throw new Error(`WALLET_CURRENCY_MISMATCH:${wallet.currency}:${sellerOrder.currency}`);
        const gross = item.price.mul(item.quantity).toDecimalPlaces(2);
        const split = computeSplit(gross, sellerOrder.commissionRate);
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            sellerId: sellerOrder.sellerId,
            type: 'sale',
            amount: split.sellerAmount,
            currency: sellerOrder.currency,
            orderItemId: item.id,
            orderId: sellerOrder.id ? undefined : undefined,
            dedupeKey,
            description: `Sale ${item.id.slice(0, 8)} — gross ${split.gross} ${sellerOrder.currency}, commission ${split.commission} (${split.commissionRate}%)`,
          },
        });
        await tx.sellerWallet.update({ where: { id: wallet.id }, data: { balance: { increment: split.sellerAmount }, totalEarned: { increment: split.sellerAmount } } });
        created += 1;
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  return created;
}

/** Credit every seller in an order, preserving the commission rate snapshot. */
export async function creditSellersForOrder(orderId: string): Promise<number> {
  const orders = await loadSellerOrders(orderId);
  let created = 0;
  for (const sellerOrder of orders) created += await creditSellerOrder(sellerOrder.id);
  return created;
}

export async function reverseSellersForOrder(orderId: string): Promise<number> {
  const credits = await prisma.walletTransaction.findMany({ where: { orderId, type: 'sale' } });
  let reversed = 0;
  for (const credit of credits) {
    if (!credit.orderItemId) continue;
    const dedupeKey = `refund:${credit.orderItemId}`;
    try {
      await prisma.$transaction(async (tx) => {
        const exists = await tx.walletTransaction.findUnique({ where: { dedupeKey } });
        if (exists) return;
        await tx.walletTransaction.create({ data: {
          walletId: credit.walletId,
          sellerId: credit.sellerId,
          type: 'refund',
          amount: credit.amount.neg(),
          currency: credit.currency,
          orderItemId: credit.orderItemId,
          orderId: credit.orderId,
          dedupeKey,
          description: `Refund ${credit.orderId?.slice(0, 8) ?? ''}`,
        } });
        await tx.sellerWallet.update({ where: { id: credit.walletId }, data: { balance: { decrement: credit.amount }, totalEarned: { decrement: credit.amount } } });
        reversed += 1;
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  return reversed;
}

export interface PayoutInput {
  amount: Prisma.Decimal | string;
  method: 'bank_transfer' | 'cash' | 'whatsapp' | 'atoma_pay';
  accountInfo: string;
  sellerNote?: string;
}

export async function requestPayout(sellerId: string, input: PayoutInput) {
  let amount: Prisma.Decimal;
  try { amount = decimal(input.amount).toDecimalPlaces(2); } catch { throw new PayoutError('invalid_amount', 'مبلغ برداشت نامعتبر است.'); }
  if (amount.lessThanOrEqualTo(0)) throw new PayoutError('invalid_amount', 'مبلغ برداشت باید بزرگ‌تر از صفر باشد.');

  return prisma.$transaction(async (tx) => {
    await tx.sellerWallet.upsert({ where: { sellerId }, update: {}, create: { sellerId } });
    const debit = await tx.sellerWallet.updateMany({ where: { sellerId, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
    if (debit.count === 0) throw new PayoutError('insufficient_funds', 'موجودی کیف پول برای این برداشت کافی نیست.');
    const wallet = await tx.sellerWallet.findUniqueOrThrow({ where: { sellerId } });
    const reference = `PO-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const payout = await tx.payout.create({ data: { reference, sellerId, amount, currency: wallet.currency, method: input.method, accountInfo: input.accountInfo, sellerNote: input.sellerNote, status: 'pending' } });
    await tx.walletTransaction.create({ data: { walletId: wallet.id, sellerId, type: 'payout', amount: amount.neg(), currency: wallet.currency, payoutId: payout.id, dedupeKey: `payout:${payout.id}`, description: `Payout request ${reference}` } });
    return payout;
  });
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

    const transitioned = await tx.payout.updateMany({
      where: { id: payoutId, status: payout.status },
      data: { status: decision, adminNote: adminNote ?? payout.adminNote, processedAt: ['approved', 'paid', 'rejected'].includes(decision) ? new Date() : payout.processedAt },
    });
    if (transitioned.count === 0) throw new PayoutError('conflict', 'وضعیت این برداشت هم‌زمان تغییر کرد. صفحه را تازه کنید.');

    if (decision === 'paid') {
      await tx.sellerWallet.update({ where: { sellerId: payout.sellerId }, data: { totalPaidOut: { increment: payout.amount } } });
    }
    if (decision === 'rejected') {
      const wallet = await tx.sellerWallet.upsert({ where: { sellerId: payout.sellerId }, update: {}, create: { sellerId: payout.sellerId, currency: payout.currency } });
      await tx.walletTransaction.create({ data: { walletId: wallet.id, sellerId: payout.sellerId, type: 'payout_reversal', amount: payout.amount, currency: payout.currency, payoutId: payout.id, dedupeKey: `payout_reversal:${payout.id}`, description: `Payout reversal ${payout.reference}` } });
      await tx.sellerWallet.update({ where: { id: wallet.id }, data: { balance: { increment: payout.amount } } });
    }
    return tx.payout.findUniqueOrThrow({ where: { id: payoutId } });
  });
}

export class PayoutError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
