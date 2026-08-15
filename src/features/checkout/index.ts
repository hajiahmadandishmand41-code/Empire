/**
 * Public surface of the `checkout` feature (Phase 7).
 *
 * A pure-frontend checkout:
 *   - Customer-details form with i18n validation
 *   - Order summary (items + shipping + total)
 *   - Payment method picker (COD only; online = Coming soon)
 *   - Mock order creation + success redirect
 *
 * No backend, no real payment. All types match `@/types/order` so
 * hooking a real API in later requires only `src/lib/api/orders.ts`.
 */
export { CheckoutView } from './components/checkout-view';
export { CheckoutForm } from './components/checkout-form';
export { OrderSummary } from './components/order-summary';
export { PaymentMethodPicker } from './components/payment-method';
export { useCheckoutForm } from './hooks/use-checkout-form';
export {
  saveLastOrder,
  readLastOrder,
  clearLastOrder,
  LAST_ORDER_KEY,
} from './hooks/use-order-storage';
export {
  buildMockOrder,
  buildOrderDraft,
  buildShippingAddress,
  computeCheckoutSummary,
  MOCK_SHIPPING,
} from './lib/build-order';
export type { CheckoutFormState, CheckoutSummary, SupportedPaymentMethod } from './types';
export { initialCheckoutForm } from './types';
