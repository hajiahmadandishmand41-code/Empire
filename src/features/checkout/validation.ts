/**
 * Checkout feature validation — thin re-export around the shared
 * `src/lib/validation/checkout` so form code can import from one place.
 */
export {
  validateCheckout,
  isCheckoutValid,
  validateFullName,
  validatePhone,
  validateProvince,
  validateDistrict,
  validateAddressLine,
} from '@/lib/validation/checkout';
export type { CheckoutErrors, CheckoutField, CheckoutInput } from '@/lib/validation/checkout';
