'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { whatsappConfig, buildWhatsAppUrl } from '@/config/site';

/**
 * WhatsAppFloatButton — global floating "chat with us" affordance.
 *
 * Only renders when `whatsappConfig.enabled` is true. Position is
 * bottom-right in LTR, bottom-left in RTL — via `rtl:` variants.
 */
export function WhatsAppFloatButton() {
  const t = useTranslations('whatsapp');

  if (!whatsappConfig.enabled) return null;

  const href = buildWhatsAppUrl(t('defaultMessage'));

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('label')}
      className={cn(
        'fixed bottom-5 right-5 z-50 rtl:left-5 rtl:right-auto',
        'group inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/20',
        'transition-transform duration-200 hover:scale-105 hover:bg-[#1DA851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2',
        'sm:bottom-6 sm:right-6 sm:rtl:left-6 sm:rtl:right-auto',
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15"
      >
        <MessageCircle className="h-4 w-4" />
      </span>
      <span className="hidden text-sm font-medium sm:inline">{t('cta')}</span>
    </a>
  );
}
