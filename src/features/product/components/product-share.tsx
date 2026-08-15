'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface ProductShareProps {
  productName: string;
  productSlug: string;
  locale: string;
}

/**
 * Client-side share component:
 *  - Permalink display
 *  - Copy Link button
 *  - Social share icons: WhatsApp, Telegram, Facebook, X, Instagram, Messenger, Email
 */
export function ProductShare({ productName, productSlug, locale }: ProductShareProps) {
  const [copied, setCopied] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Build the absolute product URL
  const getProductUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${locale}/shop/${productSlug}`;
    }
    return `/${locale}/shop/${productSlug}`;
  };

  const handleCopy = async () => {
    try {
      const url = getProductUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const url = getProductUrl();
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getShareLinks = () => {
    const url = getProductUrl();
    const text = encodeURIComponent(`${productName} — Empire Shop`);
    const encodedUrl = encodeURIComponent(url);
    return {
      whatsapp: `https://wa.me/?text=${text}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://x.com/intent/tweet?text=${text}&url=${encodedUrl}`,
      instagram: `https://www.instagram.com/`,
      messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`,
      email: `mailto:?subject=${text}&body=${text}%20${encodedUrl}`,
    };
  };

  if (!mounted) return null;

  const shareLinks = getShareLinks();

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
      {/* Header */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        اشتراک‌گذاری محصول
      </h3>

      {/* Permalink + Copy */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-2">
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-xs text-muted-foreground num-ltr">
            /{locale}/shop/{productSlug}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'کپی شد' : 'کپی لینک'}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200',
            copied
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'border border-border bg-card text-foreground hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400',
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              <span>کپی شد</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              <span>کپی لینک</span>
            </>
          )}
        </button>
      </div>

      {/* Social Share Icons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* WhatsApp */}
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="اشتراک‌گذاری در WhatsApp"
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-[#25D366] transition-all hover:border-[#25D366]/30 hover:bg-[#25D366]/10 hover:shadow-sm dark:hover:bg-[#25D366]/20"
          title="WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>

        {/* Telegram */}
        <a
          href={shareLinks.telegram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="اشتراک‌گذاری در Telegram"
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-[#2AABEE] transition-all hover:border-[#2AABEE]/30 hover:bg-[#2AABEE]/10 hover:shadow-sm dark:hover:bg-[#2AABEE]/20"
          title="Telegram"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </a>

        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="اشتراک‌گذاری در Facebook"
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-[#1877F2] transition-all hover:border-[#1877F2]/30 hover:bg-[#1877F2]/10 hover:shadow-sm dark:hover:bg-[#1877F2]/20"
          title="Facebook"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>

        {/* X (Twitter) */}
        <a
          href={shareLinks.x}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="اشتراک‌گذاری در X (Twitter)"
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all hover:border-foreground/30 hover:bg-foreground/5 hover:shadow-sm dark:hover:bg-foreground/10"
          title="X (Twitter)"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>

        {/* Instagram */}
        <a
          href={shareLinks.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="باز کردن Instagram"
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition-all hover:border-pink-400/30 hover:bg-pink-50/50 hover:shadow-sm dark:hover:bg-pink-950/20"
          title="Instagram"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <defs>
              <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f09433"/>
                <stop offset="25%" stopColor="#e6683c"/>
                <stop offset="50%" stopColor="#dc2743"/>
                <stop offset="75%" stopColor="#cc2366"/>
                <stop offset="100%" stopColor="#bc1888"/>
              </linearGradient>
            </defs>
            <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>

        {/* Messenger */}
        <a
          href={shareLinks.messenger}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="اشتراک‌گذاری در Messenger"
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-[#006AFF] transition-all hover:border-[#006AFF]/30 hover:bg-[#006AFF]/10 hover:shadow-sm dark:hover:bg-[#006AFF]/20"
          title="Messenger"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259 6.559-6.963 3.13 3.259 5.889-3.259-6.559 6.963z"/>
          </svg>
        </a>

        {/* Email */}
        <a
          href={shareLinks.email}
          aria-label="اشتراک‌گذاری از طریق Email"
          className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:border-rose-300/50 hover:bg-rose-50/50 hover:text-rose-600 hover:shadow-sm dark:hover:border-rose-700/50 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
          title="Email"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
