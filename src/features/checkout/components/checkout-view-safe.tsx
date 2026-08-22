'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Loader2, ArrowRight, Plus, MapPin } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/feedback';
import { useCartStore, useHydratedCartItems, type CartItem } from '@/features/cart';
import type { CartLineBase, Order, ShippingAddress, ShippingMethod } from '@/types';
import { CheckoutForm } from './checkout-form';
import { OrderSummary } from './order-summary';
import { PaymentMethodPicker } from './payment-method';
import { ShippingMethodPicker } from './shipping-method';
import { SavedAddressPicker } from './saved-address-picker';
import { useCheckoutForm } from '../hooks/use-checkout-form';
import { saveLastOrder } from '../hooks/use-order-storage';
import { buildOrderDraft, computeCheckoutSummary } from '../lib/build-order';

interface CheckoutViewSafeProps { locale: string; }
interface OrderApiResponse { ok: boolean; data?: Order; error?: { message?: string; code?: string }; }

export function CheckoutViewSafe({ locale }: CheckoutViewSafeProps) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const { toast } = useToast();
  const { items, hydrated } = useHydratedCartItems();
  const clear = useCartStore((s) => s.clear);
  const form = useCheckoutForm();
  const [paymentMethod, setPaymentMethod] = React.useState<'cod' | 'atoma_pay'>('cod');
  const [submitting, setSubmitting] = React.useState(false);
  const [methods, setMethods] = React.useState<ShippingMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = React.useState(true);
  const [selectedMethod, setSelectedMethod] = React.useState<ShippingMethod | null>(null);
  const [savedAddresses, setSavedAddresses] = React.useState<ShippingAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = React.useState(true);
  const [savedAddressId, setSavedAddressId] = React.useState<string | null>(null);
  const [useSavedAddress, setUseSavedAddress] = React.useState(false);
  const idempotencyKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/shipping-methods', { credentials: 'same-origin' });
        const json: unknown = await res.json();
        if (!cancelled && isShippingMethodsResponse(json) && json.ok) {
          setMethods(json.data.items);
          setSelectedMethod(json.data.items[0] ?? null);
        }
      } catch {
        // Keep the checkout usable even when the shipping endpoint is unavailable.
      } finally {
        if (!cancelled) setMethodsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/addresses', { credentials: 'same-origin' });
        if (!res.ok) return;
        const json: unknown = await res.json();
        if (!cancelled && isAddressesResponse(json) && json.ok) {
          setSavedAddresses(json.data.items);
          const def = json.data.items.find((address) => address.isDefault) ?? json.data.items[0];
          if (def?.id) {
            setSavedAddressId(def.id);
            setUseSavedAddress(true);
          }
        }
      } catch {
        // Guests naturally land here and simply use the delivery form below.
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!hydrated) {
    return <div aria-hidden className="grid gap-6 lg:grid-cols-[1fr_380px]"><div className="h-96 animate-pulse rounded-2xl border border-border/70 bg-card/60" /><div className="h-96 animate-pulse rounded-2xl border border-border/70 bg-card/60" /></div>;
  }

  if (items.length === 0) {
    return <EmptyState Icon={ShoppingBag} title={t('emptyCart.title')} description={t('emptyCart.description')} action={<Button asChild variant="gold" size="lg" className="gap-2"><Link href="/shop"><ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /><span>{t('emptyCart.action')}</span></Link></Button>} />;
  }

  const lines: CartLineBase[] = items.map(toCartLineBase);
  const effectiveSavedAddress = useSavedAddress && savedAddressId !== null && savedAddresses.length > 0;
  const summary = computeCheckoutSummary(lines, 'AFN', selectedMethod?.cost);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!effectiveSavedAddress) {
      (Object.keys(form.values) as Array<keyof typeof form.values>).forEach(form.markTouched);
      const errs = form.validate();
      if (Object.keys(errs).length > 0) {
        toast({ title: t('toast.invalid.title'), description: t('toast.invalid.description'), variant: 'destructive' });
        return;
      }
    }

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    setSubmitting(true);
    try {
      const draft = buildOrderDraft(form.values, lines, paymentMethod, 'AFN', {
        addressId: effectiveSavedAddress ? savedAddressId ?? undefined : undefined,
        shippingMethod: selectedMethod,
      });

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKeyRef.current },
        credentials: 'same-origin',
        body: JSON.stringify(draft),
      });

      const parsed: unknown = await res.json().catch(() => null);
      if (!isOrderApiResponse(parsed)) {
        toast({ title: t('toast.invalid.title'), description: `Server error (HTTP ${res.status})`, variant: 'destructive' });
        return;
      }
      if (!parsed.ok || !parsed.data) {
        toast({ title: t('toast.invalid.title'), description: parsed.error?.message ?? `Order creation failed (HTTP ${res.status})`, variant: 'destructive' });
        return;
      }

      const order = parsed.data;
      saveLastOrder(order);

      if (paymentMethod === 'atoma_pay') {
        try {
          const payRes = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ orderReference: order.reference }),
          });
          const payJson: unknown = await payRes.json().catch(() => null);
          if (isPaymentResponse(payJson) && payJson.ok && payJson.data?.redirectUrl) {
            // Keep cart until payment is confirmed. A failed/cancelled payment can then return safely to checkout.
            window.location.href = payJson.data.redirectUrl;
            return;
          }
          const message = isPaymentResponse(payJson) ? payJson.error?.message : undefined;
          toast({ title: t('toast.invalid.title'), description: message ?? 'Payment could not be started', variant: 'destructive' });
          router.push(`/payment/${order.reference}`);
          return;
        } catch {
          router.push(`/payment/${order.reference}`);
          return;
        }
      }

      clear();
      toast({ title: t('toast.success.title'), description: t('toast.success.description', { reference: order.reference }) });
      router.push('/order/success');
    } catch (err) {
      console.error('[checkout] unexpected error:', err);
      toast({ title: t('toast.invalid.title'), description: err instanceof Error ? err.message : 'Unexpected error. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start" noValidate>
      <div className="flex flex-col gap-6">
        {!addressesLoading && savedAddresses.length > 0 ? (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5" aria-label="Saved delivery addresses">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" aria-hidden /><h2 className="text-sm font-semibold text-foreground">{locale === 'en' ? 'Delivery address' : locale === 'ps' ? 'د سپارلو پته' : 'آدرس تحویل'}</h2></div>
              <button type="button" onClick={() => setUseSavedAddress((value) => !value)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                {useSavedAddress ? <><Plus className="h-3.5 w-3.5" />{locale === 'en' ? 'Use new address' : locale === 'ps' ? 'نوې پته وکاروئ' : 'آدرس جدید'}</> : <>{locale === 'en' ? 'Use saved address' : locale === 'ps' ? 'خوندي پته وکاروئ' : 'آدرس ذخیره‌شده'}</>}
              </button>
            </div>
            {useSavedAddress ? <SavedAddressPicker addresses={savedAddresses} value={savedAddressId} onChange={setSavedAddressId} /> : <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Enter a different delivery address below.' : locale === 'ps' ? 'لاندې د بلې سپارلو پتې معلومات ولیکئ.' : 'برای تحویل به آدرس دیگری، اطلاعات آن را پایین وارد کنید.'}</p>}
          </section>
        ) : null}

        {!effectiveSavedAddress ? <CheckoutForm values={form.values} errors={form.errors} touched={form.touched} onChange={form.setField} onBlur={form.markTouched} /> : null}
        <ShippingMethodPicker methods={methods} value={selectedMethod?.id} onChange={setSelectedMethod} loading={methodsLoading} />
        <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
        <OrderSummary items={items} summary={summary} locale={locale} />
        <Button type="submit" variant="gold" size="lg" className="gap-2" disabled={submitting || methodsLoading}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          <span>{submitting ? t('submitting') : t('submit')}</span>
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t('legalHint')}</p>
      </aside>
    </form>
  );
}

function toCartLineBase(item: CartItem): CartLineBase {
  return { slug: item.slug, name: item.name, price: item.price, currency: 'AFN', quantity: item.quantity, region: item.region, categoryKey: item.categoryKey };
}
function isShippingMethodsResponse(value: unknown): value is { ok: true; data: { items: ShippingMethod[] } } { if (!isRecord(value) || value.ok !== true || !isRecord(value.data) || !Array.isArray(value.data.items)) return false; return value.data.items.every(isShippingMethod); }
function isShippingMethod(value: unknown): value is ShippingMethod { if (!isRecord(value)) return false; return typeof value.id === 'string' && typeof value.key === 'string' && typeof value.name === 'string' && typeof value.kind === 'string' && typeof value.cost === 'number' && typeof value.currency === 'string' && typeof value.isActive === 'boolean' && typeof value.sortOrder === 'number'; }
function isAddressesResponse(value: unknown): value is { ok: true; data: { items: ShippingAddress[] } } { if (!isRecord(value) || value.ok !== true || !isRecord(value.data) || !Array.isArray(value.data.items)) return false; return value.data.items.every(isShippingAddress); }
function isShippingAddress(value: unknown): value is ShippingAddress { if (!isRecord(value)) return false; return typeof value.fullName === 'string' && typeof value.phone === 'string' && typeof value.province === 'string' && typeof value.district === 'string' && typeof value.addressLine === 'string'; }
function isOrderApiResponse(value: unknown): value is OrderApiResponse { if (!isRecord(value) || typeof value.ok !== 'boolean') return false; if (!value.ok) return value.data === undefined; return isOrder(value.data); }
function isOrder(value: unknown): value is Order { if (!isRecord(value) || typeof value.id !== 'string' || typeof value.reference !== 'string' || typeof value.status !== 'string' || typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string' || !Array.isArray(value.items) || !isShippingAddress(value.address) || !isRecord(value.summary)) return false; return typeof value.summary.itemCount === 'number' && typeof value.summary.subtotal === 'number' && typeof value.summary.currency === 'string' && value.items.every(isCartLineBase); }
function isCartLineBase(value: unknown): value is CartLineBase { if (!isRecord(value)) return false; return typeof value.slug === 'string' && typeof value.name === 'string' && typeof value.price === 'number' && typeof value.quantity === 'number'; }
function isPaymentResponse(value: unknown): value is { ok: boolean; data?: { redirectUrl?: string }; error?: { message?: string } } { if (!isRecord(value) || typeof value.ok !== 'boolean') return false; if (value.data !== undefined && (!isRecord(value.data) || (value.data.redirectUrl !== undefined && typeof value.data.redirectUrl !== 'string'))) return false; if (value.error !== undefined && (!isRecord(value.error) || (value.error.message !== undefined && typeof value.error.message !== 'string'))) return false; return true; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
