import type {
  CartLineBase,
  CartSummary,
  Order,
  OrderDraft,
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
} from '@/types';
import type { CheckoutFormState, CheckoutSummary } from '../types';

/** Fallback flat cost used when no ShippingMethod is loaded yet. */
export const MOCK_SHIPPING = 10;

export function buildShippingAddress(form: CheckoutFormState): ShippingAddress {
  return {
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
    province: form.province.trim(),
    district: form.district.trim(),
    city: form.city?.trim() || undefined,
    addressLine: form.addressLine.trim(),
    notes: form.notes.trim() ? form.notes.trim() : undefined,
  };
}

export function computeCheckoutSummary(
  items: CartLineBase[],
  currency: CartSummary['currency'] = 'USD',
  shippingOverride?: number,
): CheckoutSummary {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const shipping =
    items.length > 0 ? (typeof shippingOverride === 'number' ? shippingOverride : MOCK_SHIPPING) : 0;
  return {
    itemCount,
    subtotal,
    currency,
    shipping,
    total: subtotal + shipping,
  };
}

export function buildOrderDraft(
  form: CheckoutFormState,
  items: CartLineBase[],
  paymentMethod: PaymentMethod = 'cod',
  currency: CartSummary['currency'] = 'USD',
  opts: {
    addressId?: string;
    shippingMethod?: ShippingMethod | null;
  } = {},
): OrderDraft {
  const summary = computeCheckoutSummary(items, currency, opts.shippingMethod?.cost);
  const { shipping: _shipping, total: _total, ...cartSummary } = summary;
  return {
    items,
    address: buildShippingAddress(form),
    addressId: opts.addressId,
    paymentMethod,
    shippingMethodId: opts.shippingMethod?.id,
    shippingMethodKey: opts.shippingMethod?.key,
    summary: cartSummary,
  };
}

export function buildMockOrder(draft: OrderDraft): Order {
  const now = new Date().toISOString();
  const ref = `EMP-${Date.now().toString(36).toUpperCase()}`;
  const address: ShippingAddress =
    draft.address ?? {
      fullName: '',
      phone: '',
      province: '',
      district: '',
      addressLine: '',
    };
  return {
    ...draft,
    address,
    id: `mock_${Math.random().toString(36).slice(2, 10)}`,
    reference: ref,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}
