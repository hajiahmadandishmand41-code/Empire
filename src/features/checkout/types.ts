import type { CartSummary, Order, OrderDraft, PaymentMethod, ShippingAddress } from '@/types';
import { DEFAULT_PROVINCE } from '@/lib/afghanistan/provinces';

/**
 * Checkout form state — mirrors ShippingAddress but every field
 * is a plain string so the form stays controlled from mount.
 *
 * Province defaults to Kabul (the capital and most common delivery
 * destination). Change `DEFAULT_PROVINCE` in provinces.ts to update
 * this default everywhere at once.
 */
export interface CheckoutFormState {
  fullName: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  addressLine: string;
  city: string;
  notes: string;
}

export const initialCheckoutForm: CheckoutFormState = {
  fullName: '',
  phone: '',
  email: '',
  province: DEFAULT_PROVINCE,
  district: '',
  addressLine: '',
  city: '',
  notes: '',
};

export interface CheckoutSummary extends CartSummary {
  shipping: number;
  total: number;
}

export type SupportedPaymentMethod = Extract<PaymentMethod, 'cod'>;

export type { ShippingAddress, OrderDraft, Order };
