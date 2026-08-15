'use client';

/**
 * PWAProvider — نصب برنامه و وضعیت آفلاین
 */

import { useEffect, useState, useCallback } from 'react';
import { X, Download, Wifi, WifiOff } from 'lucide-react';

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'empire.pwa.install.dismissedAt';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

export function PWAProvider() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [offline, setOffline] = useState(false);

  // Register service worker as a non-blocking progressive enhancement.
  // PWA installation/update must never control page rendering or navigation.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                nw.postMessage('SKIP_WAITING');
              }
            });
          });
        })
        .catch(() => {
          // PWA is optional. A registration failure must not affect the page.
        });
    };

    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);

  // beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recentlyDismissed = dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      if (!recentlyDismissed) {
        // Delay slightly so user has time to settle on page
        setTimeout(() => setShowInstall(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    const onInstalled = () => {
      setShowInstall(false);
      setDeferred(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    if (isIOS() && !recentlyDismissed) {
      const t = window.setTimeout(() => setIosHint(true), 5000);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onBIP);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Online/offline
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
      setShowInstall(false);
    }
  }, [deferred]);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setShowInstall(false);
    setIosHint(false);
  }, []);

  return (
    <>
      {/* Offline banner */}
      {offline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          <span>اتصال اینترنت قطع است — برخی امکانات محدود شده‌اند</span>
        </div>
      )}

      {/* PWA Install prompt */}
      {(showInstall || iosHint) && (
        <div
          role="dialog"
          aria-label="نصب برنامه Empire Shop"
          aria-modal="true"
          className="fixed inset-x-4 bottom-20 z-[55] md:bottom-4 md:inset-x-auto md:end-4 md:w-96 mx-auto md:mx-0"
        >
          <div className="relative overflow-hidden rounded-2xl bg-card shadow-2xl border border-border ring-1 ring-black/5">
            {/* Gradient accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Logo */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 shadow-sm">
                  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
                    <path d="M16 3 L28 10 L28 22 L16 29 L4 22 L4 10 Z" fill="white" fillOpacity="0.9"/>
                    <path d="M12 13 L16 11 L20 13 L20 19 L16 21 L12 19 Z" fill="#e11d48"/>
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm leading-snug">
                    نصب Empire Shop
                  </p>
                  {iosHint ? (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      در Safari روی دکمه{' '}
                      <span className="inline-flex items-center rounded bg-muted px-1 py-0.5 text-[10px] font-medium">اشتراک‌گذاری ↑</span>
                      {' '}بزنید و «افزودن به صفحه اصلی» را انتخاب کنید.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      برنامه را نصب کنید تا سریع‌تر، آفلاین و مانند اپ بومی استفاده کنید.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="بستن"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              {showInstall && !iosHint && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={install}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    نصب برنامه
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    بعداً
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PWAProvider;
