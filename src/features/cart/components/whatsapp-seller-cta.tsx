'use client';

import * as React from 'react';
import { MessageCircle } from 'lucide-react';

interface Props {
  /** Optional seller id. If provided, we fetch that seller's whatsapp. */
  sellerId?: string;
  /** Fallback message pre-filled into WhatsApp. */
  message?: string;
  className?: string;
}

interface SellerPublic {
  sellerShopName: string | null;
  sellerWhatsapp: string | null;
}

/**
 * Renders a green WhatsApp button that opens a chat with the seller.
 * Only visible when the seller has a WhatsApp number configured.
 */
export function WhatsAppSellerCta({ sellerId, message, className }: Props) {
  const [data, setData] = React.useState<SellerPublic | null>(null);

  React.useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sellers/${sellerId}/public`, { credentials: 'include' });
        const json = await res.json();
        if (!cancelled && json?.ok) setData(json.data as SellerPublic);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  if (!data?.sellerWhatsapp) return null;

  const digits = data.sellerWhatsapp.replace(/[^\d]/g, '');
  const text = message ?? `سلام، درباره سفارش از فروشگاه ${data.sellerShopName ?? ''} سوال دارم.`;
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-700/10 transition-transform hover:scale-[1.01] hover:bg-[#1DA851] ' +
        (className ?? '')
      }
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      گفتگو در واتساپ با فروشنده
    </a>
  );
}
