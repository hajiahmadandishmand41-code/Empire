import type { CartLineBase, CartSummary } from './cart';

export type OrderStatus =
  'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cod' | 'bank_transfer' | 'whatsapp' | 'atoma_pay';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export type ShippingKind = 'standard' | 'express' | 'cod';

/** Afghan shipping address. Matches the checkout validation schema. */
export interface ShippingAddress {
  id?: string;
  label?: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  city?: string;
  addressLine: string;
  postalCode?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface ShippingMethod {
  id: string;
  key: string;
  name: string;
  description?: string;
  kind: ShippingKind;
  cost: number;
  currency: string;
  etaDays?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface OrderDraft {
  items: CartLineBase[];
  address?: ShippingAddress;
  /** If provided (signed-in user), use this saved address instead of creating a new one. */
  addressId?: string;
  paymentMethod: PaymentMethod;
  /** Optional selected shipping method key or id. */
  shippingMethodId?: string;
  shippingMethodKey?: string;
  summary: CartSummary;
}

export interface Order extends OrderDraft {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingCost?: number;
  shippingMethod?: ShippingMethod | null;
  createdAt: string;
  updatedAt: string;
  /** Server always resolves an address for a persisted order. */
  address: ShippingAddress;
}

export interface Transaction {
  id: string;
  orderId: string;
  reference: string;
  provider: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerTxnId?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
