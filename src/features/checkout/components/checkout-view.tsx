'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/feedback';
import { useCartStore, useHydratedCartItems, type CartItem } from '@/features/cart';
import type { CartLineBase, ShippingAddress, ShippingMethod } from '@/types';
import { CheckoutForm } from './checkout-form';
import { OrderSummary } from './order-summary';
import { PaymentMethodPicker } from './payment-method';
import { ShippingMethodPicker } from './shipping-method';
import { SavedAddressPicker } from './saved-address-picker';
import { useCheckoutForm } from '../hooks/use-checkout-form';
import { saveLastOrder } from '../hooks/use-order-storage';
import { buildOrderDraft, computeCheckoutSummary } from '../lib/build-order';

interface CheckoutViewProps {
  locale: string;
}

export function CheckoutView({ locale }: CheckoutViewProps) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { toast } = useToast();
  const { items, hydrated } = useHydratedCartItems();
  const clear = useCartStore((s) => s.clear);
  const form = useCheckoutForm();
  const [paymentMethod, setPaymentMethod] = React.useState<'cod' | 'atoma_pay'>('cod');
  const [submitting, setSubmitting] = React.useState(false);

  // Shipping methods (Phase 3)
  const [methods, setMethods] = React.useState<ShippingMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = React.useState(true);
  const [selectedMethod, setSelectedMethod] = React.useState<ShippingMethod | null>(null);

  // Saved addresses (Phase 3)
  const [savedAddresses, setSavedAddresses] = React.useState<ShippingAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = React.useState(true);
  const [savedAddressId, setSavedAddressId] = React.useState<string | null>(null);

  // Load shipping methods (public — always works)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/shipping-methods');
        const json = (await res.json()) as { ok: boolean; data?: { items: ShippingMethod[] } };
        if (!cancelled && json.ok && json.data) {
          setMethods(json.data.items);
          setSelectedMethod(json.data.items[0] ?? null);
        }
      } catch {
        /* ignore — UI falls back to no shipping selector */
      } finally {
        if (!cancelled) setMethodsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load saved addresses (only if signed in — endpoint returns 401 otherwise)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/addresses');
        if (!res.ok) return;
        const json = (await res.json()) as { ok: boolean; data?: { items: ShippingAddress[] } };
        if (!cancelled && json.ok && json.data) {
          setSavedAddresses(json.data.items);
          const def = json.data.items.find((a) => a.isDefault) ?? json.data.items[0];
          if (def?.id) setSavedAddressId(def.id);
        }
      } catch { /* not signed in — OK */ } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!hydrated) {
    return (
      <div aria-hidden className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="h-96 animate-pulse rounded-2xl border border-border/70 bg-card/60" />
        <div className="h-96 animate-pulse rounded-2xl border border-border/70 bg-card/60" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        Icon={ShoppingBag}
        title={t('emptyCart.title')}
        description={t('emptyCart.description')}
        action={
          <Button asChild variant="gold" size="lg" className="gap-2">
            <Link href="/shop">
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              <span>{t('emptyCart.action')}</span>
            </Link>
          </Button>
        }
      />
    );
  }

  const lines: CartLineBase[] = items.map(toCartLineBase);
  const summary = computeCheckoutSummary(lines, 'AFN', selectedMethod?.cost);

  const useSavedAddress = savedAddressId !== null && savedAddresses.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // If using a NEW address, validate the form. Otherwise skip.
    if (!useSavedAddress) {
      (Object.keys(form.values) as Array<keyof typeof form.values>).forEach(form.markTouched);
      const errs = form.validate();
      if (Object.keys(errs).length > 0) {
        toast({
          title: t('toast.invalid.title'),
          description: t('toast.invalid.description'),
          variant: 'destructive',
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const draft = buildOrderDraft(form.values, lines, paymentMethod, 'AFN', {
        addressId: useSavedAddress ? savedAddressId ?? undefined : undefined,
        shippingMethod: selectedMethod,
      });

      // Call real API — never fall back to mock.
      // On failure: show error, keep cart intact, allow retry.
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      let json: { ok: boolean; data?: { id: string; reference: string; [key: string]: unknown }; error?: { message?: string; code?: string } };
      try {
        json = await res.json() as typeof json;
      } catch {
        toast({
          title: t('toast.invalid.title'),
          description: `Server error (HTTP ${res.status})`,
          variant: 'destructive',
        });
        return;
      }

      if (!json.ok || !json.data) {
        const errMsg = json.error?.message ?? `Order creation failed (HTTP ${res.status})`;
        toast({
          title: t('toast.invalid.title'),
          description: errMsg,
          variant: 'destructive',
        });
        return;
      }

      // Order successfully created — persist the reference.
      // The cart is cleared only after a successful payment-session creation
      // for online payments, so a temporary gateway failure never destroys
      // the customer's local cart.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      saveLastOrder(json.data as any);

      const reference = json.data.reference as string;

      if (paymentMethod === 'atoma_pay') {
        try {
          const payRes = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderReference: reference }),
          });
          const payJson = (await payRes.json()) as {
            ok: boolean;
            data?: { redirectUrl?: string };
            error?: { message?: string };
          };
          if (payJson.ok && payJson.data?.redirectUrl) {
            clear();
            window.location.href = payJson.data.redirectUrl;
            return;
          }
          toast({
            title: t('toast.invalid.title'),
            description: payJson.error?.message ?? 'Payment failed',
            variant: 'destructive',
          });
          router.push(`/payment/${reference}`);
          return;
        } catch {
          router.push(`/payment/${reference}`);
          return;
        }
      }

      clear();
      toast({
        title: t('toast.success.title'),
        description: t('toast.success.description', { reference }),
      });
      router.push('/order/success');
    } catch (err) {
      console.error('[checkout] unexpected error:', err);
      toast({
        title: t('toast.invalid.title'),
        description: err instanceof Error ? err.message : 'Unexpected error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start"
      noValidate
    >
      <div className="flex flex-col gap-6">
        {!addressesLoading && savedAddresses.length > 0 ? (
          <SavedAddressPicker
            addresses={savedAddresses}
            value={savedAddressId}
            onChange={setSavedAddressId}
          />
        ) : null}

        {!useSavedAddress ? (
          <CheckoutForm
            values={form.values}
            errors={form.errors}
            touched={form.touched}
            onChange={form.setField}
            onBlur={form.markTouched}
          />
        ) : null}

        <ShippingMethodPicker
          methods={methods}
          value={selectedMethod?.id}
          onChange={setSelectedMethod}
          loading={methodsLoading}
        />

        <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
        <OrderSummary items={items} summary={summary} locale={locale} />
        <Button type="submit" variant="gold" size="lg" className="gap-2" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          <span>{submitting ? t('submitting') : t('submit')}</span>
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t('legalHint')}</p>
      </aside>
    </form>
  );
}

function toCartLineBase(item: CartItem): CartLineBase {
  return {
    slug: item.slug,
    name: item.name,
    price: item.price,
    currency: 'AFN',
    quantity: item.quantity,
    region: item.region,
    categoryKey: item.categoryKey,
  };
}
