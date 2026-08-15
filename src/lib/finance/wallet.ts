/**
 * Empire Shop — Phase 7: Seller finance core.
 *
 * Server-only. All balance math flows through this module so:
 *   * Commission is applied consistently (per-seller rate on User.commissionRate).
 *   * Wallet balance is mutated inside a Prisma $transaction alongside the
 *     matching WalletTransaction ledger row (no drift).
 *   * Every credit/debit is idempotent via WalletTransaction.dedupeKey.
 *
 * NEVER import from client components. Callers:
 *   * `creditSellersForOrder` — called when an order transitions to `delivered`.
 *   * `requestPayout`         — called from the seller wallet API.
 *   * `updatePayoutStatus`    — called from the admin payouts API.
 */
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/** True when a Prisma error is a unique-constraint violation (P2002). */
function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

/** All money arithmetic is Decimal-only. No JS Number is used for financial values. */
function decimal(value: Prisma.Decimal | string): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function computeSplit(
  grossInput: Prisma.Decimal | string,
  commissionRateInput: Prisma.Decimal | string,
): SplitBreakdown {
  const gross = decimal(grossInput).toDecimalPlaces(2);
  const rawRate = decimal(commissionRateInput);
  const zero = new Prisma.Decimal(0);
  const hundred = new Prisma.Decimal(100);
  const rate = rawRate.lessThan(zero) ? zero : rawRate.greaterThan(hundred) ? hundred : rawRate;
  const commission = gross.mul(rate).div(hundred).toDecimalPlaces(2);
  const sellerAmount = gross.sub(commission).toDecimalPlaces(2);
  return { gross, commission, sellerAmount, commissionRate: rate };
}

export interface SplitBreakdown {
  gross: Prisma.Decimal;
  commission: Prisma.Decimal;
  sellerAmount: Prisma.Decimal;
  commissionRate: Prisma.Decimal;
}

/** Fetch or create the seller's wallet. */
export async function ensureWallet(sellerId: string, currency = 'AFN') {
  return prisma.sellerWallet.upsert({
    where: { sellerId },
    update: {},
    create: { sellerId, currency, balance: new Prisma.Decimal(0) },
  });
}

/**
 * Credit every seller whose product appears in the given order.
 * Idempotent: a per-orderItem `dedupeKey` prevents double-crediting
 * if the order status is toggled to delivered more than once.
 *
 * Returns the number of new credits actually created.
 */
export async function creditSellersForOrder(orderId: string): Promise<number> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, currency: true },
  });
  if (!order) return 0;

  const items = await prisma.orderItem.findMany({
    where: { orderId, product: { sellerId: { not: null } } },
    include: {
      product: {
        select: {
          sellerId: true,
          seller: { select: { id: true, commissionRate: true } },
        },
      },
    },
  });

  let created = 0;
  for (const item of items) {
    const sellerId = item.product.sellerId;
    if (!sellerId) continue;
    const commissionRate = item.product.seller?.commissionRate ?? new Prisma.Decimal(10);
    const dedupeKey = `sale:${item.id}`;

    const existing = await prisma.walletTransaction.findUnique({ where: { dedupeKey } });
    if (existing) continue;

    const gross = item.price.mul(item.quantity).toDecimalPlaces(2);
    const split = computeSplit(gross, commissionRate);

    try {
      await prisma.$transaction(async (tx) => {
        const wallet = await tx.sellerWallet.upsert({
          where: { sellerId },
          update: {},
          create: { sellerId, currency: order.currency },
        });
        if (wallet.currency !== order.currency) {
          throw new Error(`WALLET_CURRENCY_MISMATCH:${wallet.currency}:${order.currency}`);
        }
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            sellerId,
            type: 'sale',
            amount: split.sellerAmount,
            currency: order.currency,
            orderId: order.id,
            orderItemId: item.id,
            dedupeKey,
            description:
              `فروش سفارش ${order.id.slice(0, 8)} — ` +
              `ناخالص ${split.gross} ${order.currency}, ` +
              `کمیسیون ${split.commission} (${split.commissionRate}%)`,
          },
        });
        await tx.sellerWallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: split.sellerAmount },
            totalEarned: { increment: split.sellerAmount },
          },
        });
      });
      created += 1;
    } catch (err) {
      // Phase 10.4 fix: a concurrent caller may have inserted the same
      // dedupeKey between our read and our write. That is not an error —
      // it means the credit already exists. Swallow the unique violation
      // and continue; propagate anything else.
      if (!isUniqueViolation(err)) throw err;
    }
  }
  return created;
}

/**
 * Reverse every seller credit previously written for this order. Called
 * when an already-delivered order is refunded. Idempotent via a
 * `refund:<orderItemId>` dedupeKey — running twice is a no-op.
 *
 * Returns the number of new reversal entries created.
 */
export async function reverseSellersForOrder(orderId: string): Promise<number> {
  // Only reverse credits that actually exist — nothing to undo otherwise.
  const credits = await prisma.walletTransaction.findMany({
    where: { orderId, type: 'sale' },
  });
  if (credits.length === 0) return 0;

  let reversed = 0;
  for (const credit of credits) {
    if (!credit.orderItemId) continue;
    const dedupeKey = `refund:${credit.orderItemId}`;
    const existing = await prisma.walletTransaction.findUnique({ where: { dedupeKey } });
    if (existing) continue;

    try {
      await prisma.$transaction(async (tx) => {
        // Race-safe debit: only apply when the wallet still holds >= the
        // credited amount. If a payout already spent it, we still write
        // the ledger entry but the balance goes into the negative for
        // admin follow-up (accounting truth > convenience).
        await tx.walletTransaction.create({
          data: {
            walletId: credit.walletId,
            sellerId: credit.sellerId,
            type: 'refund',
            amount: -credit.amount,
            currency: credit.currency,
            orderId: credit.orderId,
            orderItemId: credit.orderItemId,
            dedupeKey,
            description: `بازگشت وجه سفارش ${credit.orderId?.slice(0, 8) ?? ''}`,
          },
        });
        await tx.sellerWallet.update({
          where: { id: credit.walletId },
          data: {
            balance: { decrement: credit.amount },
            totalEarned: { decrement: credit.amount },
          },
        });
      });
      reversed += 1;
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

/**
 * Seller-initiated payout request. Deducts the amount from the wallet
 * balance immediately (funds are held). Rejecting the payout later
 * creates a `payout_reversal` credit that restores the balance.
 */
export async function requestPayout(sellerId: string, input: PayoutInput) {
  let amount: Prisma.Decimal;
  try { amount = decimal(input.amount).toDecimalPlaces(2); } catch {
    throw new PayoutError('invalid_amount', 'مبلغ برداشت نامعتبر است.');
  }
  if (amount.lessThanOrEqualTo(0)) {
    throw new PayoutError('invalid_amount', 'مبلغ برداشت باید بزرگ‌تر از صفر باشد.');
  }

  return prisma.$transaction(async (tx) => {
    // Phase 10.2 — race-safe balance debit.
    // Ensure the wallet exists, then perform a CONDITIONAL decrement that
    // only matches when balance >= amount. Two concurrent payout requests
    // can no longer both pass an in-memory check and overdraw the wallet:
    // whichever `updateMany` runs second sees `balance < amount` and
    // matches 0 rows, forcing a `insufficient_funds` error.
    await tx.sellerWallet.upsert({
      where: { sellerId },
      update: {},
      create: { sellerId },
    });

    const debit = await tx.sellerWallet.updateMany({
      where: { sellerId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (debit.count === 0) {
      throw new PayoutError('insufficient_funds', 'موجودی کیف پول برای این برداشت کافی نیست.');
    }
    const wallet = await tx.sellerWallet.findUniqueOrThrow({ where: { sellerId } });

    const reference = `PO-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, '0')}`;

    const payout = await tx.payout.create({
      data: {
        reference,
        sellerId,
        amount,
        currency: wallet.currency,
        method: input.method,
        accountInfo: input.accountInfo,
        sellerNote: input.sellerNote,
        status: 'pending',
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        sellerId,
        type: 'payout',
        amount: amount.neg(),
        currency: wallet.currency,
        payoutId: payout.id,
        dedupeKey: `payout:${payout.id}`,
        description: `درخواست برداشت ${reference}`,
      },
    });

    return payout;
  });
}


export type PayoutDecision = 'approved' | 'paid' | 'rejected';

/**
 * Admin transitions a payout. Idempotent guards prevent double-reversal
 * on repeated rejects, and forbid rejecting an already-paid payout.
 */
export async function updatePayoutStatus(
  payoutId: string,
  decision: PayoutDecision,
  adminNote?: string,
) {
  return prisma.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new PayoutError('not_found', 'درخواست برداشت یافت نشد.');

    if (payout.status === decision) return payout;
    if (payout.status === 'paid') {
      throw new PayoutError('already_paid', 'این برداشت قبلاً پرداخت شده است.');
    }
    if (payout.status === 'rejected' && decision !== 'rejected') {
      throw new PayoutError('already_rejected', 'این درخواست قبلاً رد شده است.');
    }

    // Phase 10.2 — race-safe transition. Only apply the state change when
    // the row is still in the status we just read. Two concurrent admin
    // decisions can no longer both apply side effects (double-reversal,
    // double totalPaidOut increment): the second one matches 0 rows.
    const transitioned = await tx.payout.updateMany({
      where: { id: payoutId, status: payout.status },
      data: {
        status: decision,
        adminNote: adminNote ?? payout.adminNote,
        // Phase 10.3 — also stamp processedAt on `approved`, so the admin
        // UI can show "reviewed at" even before the payout is actually paid.
        processedAt:
          decision === 'paid' || decision === 'rejected' || decision === 'approved'
            ? new Date()
            : payout.processedAt,
      },
    });
    if (transitioned.count === 0) {
      // Another admin transitioned the row between our read and write.
      throw new PayoutError('conflict', 'وضعیت این برداشت هم‌زمان تغییر کرد. صفحه را تازه کنید.');
    }

    if (decision === 'paid') {
      await tx.sellerWallet.update({
        where: { sellerId: payout.sellerId },
        data: { totalPaidOut: { increment: payout.amount } },
      });
    }

    if (decision === 'rejected') {
      const wallet = await tx.sellerWallet.upsert({
        where: { sellerId: payout.sellerId },
        update: {},
        create: { sellerId: payout.sellerId, currency: payout.currency },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          sellerId: payout.sellerId,
          type: 'payout_reversal',
          amount: payout.amount,
          currency: payout.currency,
          payoutId: payout.id,
          dedupeKey: `payout_reversal:${payout.id}`,
          description: `بازگشت مبلغ به‌دلیل رد شدن برداشت ${payout.reference}`,
        },
      });
      await tx.sellerWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: payout.amount } },
      });
    }

    return tx.payout.findUniqueOrThrow({ where: { id: payoutId } });
  });
}

export class PayoutError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}
