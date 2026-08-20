'use client';

/** PWAProvider — نصب برنامه و وضعیت آفلاین */
import { useEffect, useState, useCallback } from 'react';
import { X, Download, WifiOff } from 'lucide-react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
const DISMISS_KEY = 'eshop.pwa.install.dismissedAt';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}
function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

export function PWAProvider() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
        if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) nw.postMessage('SKIP_WAITING');
          });
        });
      }).catch(() => {});
    };
    if (document.readyState === 'complete') onLoad(); else window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone()) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recentlyDismissed = dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS;
    const onBIP = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BIPEvent);
      if (!recentlyDismissed) setTimeout(() => setShowInstall(true), 3000);
    };
    const onInstalled = () => { setShowInstall(false); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    if (isIOS() && !recentlyDismissed) {
      const timer = window.setTimeout(() => setIosHint(true), 5000);
      return () => { window.clearTimeout(timer); window.removeEventListener('beforeinstallprompt', onBIP); window.removeEventListener('appinstalled', onInstalled); };
    }
    return () => { window.removeEventListener('beforeinstallprompt', onBIP); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try { await deferred.prompt(); await deferred.userChoice; } finally { setDeferred(null); setShowInstall(false); }
  }, [deferred]);
  const dismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setShowInstall(false); setIosHint(false);
  }, []);

  return <>
    {offline && <div role="status" aria-live="polite" className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-amber-600 px-4 py-2.5 text-sm font-medium text-white"><WifiOff className="h-4 w-4 shrink-0" aria-hidden /><span>اتصال اینترنت قطع است — برخی امکانات محدود شده‌اند</span></div>}
    {(showInstall || iosHint) && <div role="dialog" aria-label="نصب برنامه ایشاپ" aria-modal="true" className="fixed inset-x-4 bottom-20 z-[55] mx-auto md:bottom-4 md:end-4 md:inset-x-auto md:w-96 md:mx-0">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-black/5">
        <div className="h-1 w-full bg-primary" />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm"><span className="text-xl font-black text-primary-foreground">E</span></div>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold leading-snug text-foreground">نصب ایشاپ</p>{iosHint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">در Safari روی «اشتراک‌گذاری» بزنید و «افزودن به صفحه اصلی» را انتخاب کنید.</p> : <p className="mt-1 text-xs leading-relaxed text-muted-foreground">ایشاپ را نصب کنید تا سریع‌تر و مانند یک برنامه بومی استفاده کنید.</p>}</div>
            <button type="button" onClick={dismiss} aria-label="بستن" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" aria-hidden /></button>
          </div>
          {showInstall && !iosHint && <div className="mt-3 flex gap-2"><button type="button" onClick={install} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm"><Download className="h-4 w-4" aria-hidden />نصب برنامه</button><button type="button" onClick={dismiss} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted">بعداً</button></div>}
        </div>
      </div>
    </div>}
  </>;
}

export default PWAProvider;
