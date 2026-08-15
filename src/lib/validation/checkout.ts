import type { ShippingAddress } from '@/types';
import { isAfghanProvince } from '@/lib/afghanistan';
import { isValidAfghanPhone } from './phone';

export type CheckoutField = keyof ShippingAddress;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export interface CheckoutInput {
  fullName?: string;
  phone?: string;
  province?: string;
  district?: string;
  addressLine?: string;
  postalCode?: string;
  notes?: string;
}

export function validateFullName(v: string | undefined): string | undefined {
  const value = v?.trim() ?? '';
  if (!value) return 'validation.fullName.required';
  if (value.length < 3) return 'validation.fullName.tooShort';
  if (value.length > 80) return 'validation.fullName.tooLong';
  return undefined;
}

export function validatePhone(v: string | undefined): string | undefined {
  const value = v?.trim() ?? '';
  if (!value) return 'validation.phone.required';
  if (!isValidAfghanPhone(value)) return 'validation.phone.invalid';
  return undefined;
}

export function validateProvince(v: string | undefined): string | undefined {
  const value = v?.trim() ?? '';
  if (!value) return 'validation.province.required';
  if (!isAfghanProvince(value)) return 'validation.province.invalid';
  return undefined;
}

export function validateDistrict(v: string | undefined): string | undefined {
  const value = v?.trim() ?? '';
  if (!value) return 'validation.district.required';
  if (value.length < 2) return 'validation.district.tooShort';
  if (value.length > 60) return 'validation.district.tooLong';
  return undefined;
}

export function validateAddressLine(v: string | undefined): string | undefined {
  const value = v?.trim() ?? '';
  if (!value) return 'validation.address.required';
  if (value.length < 6) return 'validation.address.tooShort';
  if (value.length > 200) return 'validation.address.tooLong';
  return undefined;
}

export function validateCheckout(input: CheckoutInput): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const fullName = validateFullName(input.fullName);
  const phone = validatePhone(input.phone);
  const province = validateProvince(input.province);
  const district = validateDistrict(input.district);
  const addressLine = validateAddressLine(input.addressLine);
  if (fullName) errors.fullName = fullName;
  if (phone) errors.phone = phone;
  if (province) errors.province = province;
  if (district) errors.district = district;
  if (addressLine) errors.addressLine = addressLine;
  return errors;
}

export function isCheckoutValid(input: CheckoutInput): boolean {
  return Object.keys(validateCheckout(input)).length === 0;
}
