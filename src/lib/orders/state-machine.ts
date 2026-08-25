import type { OrderStatus } from '@prisma/client';

export type OrderState = OrderStatus;

const TRANSITIONS: Record<OrderState, readonly OrderState[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const SELLER_TRANSITIONS: Record<OrderState, readonly OrderState[]> = {
  pending: ['confirmed'],
  confirmed: ['processing'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderState, to: OrderState): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function canSellerTransition(from: OrderState, to: OrderState): boolean {
  return from === to || SELLER_TRANSITIONS[from].includes(to);
}

export function canCustomerCancel(status: OrderState): boolean {
  return status === 'pending' || status === 'confirmed';
}

export function assertTransition(from: OrderState, to: OrderState): void {
  if (!canTransition(from, to)) {
    throw new Error(`INVALID_ORDER_TRANSITION:${from}:${to}`);
  }
}

export function assertSellerTransition(from: OrderState, to: OrderState): void {
  if (!canSellerTransition(from, to)) {
    throw new Error(`INVALID_SELLER_ORDER_TRANSITION:${from}:${to}`);
  }
}
