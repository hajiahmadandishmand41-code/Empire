'use client';

import * as React from 'react';
import { initialCheckoutForm, type CheckoutFormState } from '../types';
import { validateCheckout, type CheckoutErrors } from '../validation';

/**
 * useCheckoutForm — controlled form state + field-level validation.
 * Pure client hook, no side-effects beyond React state.
 */
export function useCheckoutForm(initial: Partial<CheckoutFormState> = {}) {
  const [values, setValues] = React.useState<CheckoutFormState>({
    ...initialCheckoutForm,
    ...initial,
  });
  const [errors, setErrors] = React.useState<CheckoutErrors>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const setField = React.useCallback(
    <K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const markTouched = React.useCallback((key: keyof CheckoutFormState) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const validate = React.useCallback((): CheckoutErrors => {
    const next = validateCheckout(values);
    setErrors(next);
    return next;
  }, [values]);

  const isValid = React.useMemo(() => Object.keys(validateCheckout(values)).length === 0, [values]);

  return {
    values,
    setField,
    errors,
    touched,
    markTouched,
    validate,
    isValid,
    reset: () => {
      setValues({ ...initialCheckoutForm });
      setErrors({});
      setTouched({});
    },
  };
}
