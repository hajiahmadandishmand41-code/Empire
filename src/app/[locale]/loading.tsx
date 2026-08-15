/**
 * Route-level Suspense fallback for every page under /[locale].
 * Shows a fast, branded Empire Shop splash screen while data streams in.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="در حال بارگذاری…"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      {/* Logo mark */}
      <div className="relative mb-5">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-rose-500/20 blur-xl scale-110" />
        {/* Logo container */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#DC1649] via-[#c01040] to-[#7a0828] shadow-xl shadow-rose-500/30">
          {/* Crown + E mark (inline SVG — no import, instant paint) */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Crown */}
            <g transform="translate(7,4)">
              <rect x="1" y="11" width="24" height="3" rx="1.5" fill="white"/>
              <polygon points="1,11 1,4 6,8" fill="rgba(255,255,255,0.9)"/>
              <polygon points="13,11 8,4 18,4" fill="white"/>
              <polygon points="25,11 25,4 20,8" fill="rgba(255,255,255,0.9)"/>
              <circle cx="1" cy="4" r="1.5" fill="#FFE066"/>
              <circle cx="13" cy="3.5" r="1.8" fill="#FFE066"/>
              <circle cx="25" cy="4" r="1.5" fill="#FFE066"/>
            </g>
            {/* Letter E */}
            <g transform="translate(10,17)">
              <rect x="0" y="0" width="4" height="18" rx="2" fill="white"/>
              <rect x="0" y="0" width="17" height="4" rx="2" fill="white"/>
              <rect x="0" y="7" width="13" height="4" rx="2" fill="rgba(255,255,255,0.85)"/>
              <rect x="0" y="14" width="17" height="4" rx="2" fill="white"/>
            </g>
          </svg>
        </div>
      </div>

      {/* Brand name */}
      <p className="text-base font-extrabold tracking-tight text-foreground mb-1">
        EmpireShop
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-6">
        فروشگاه آنلاین افغانستان
      </p>

      {/* Slim animated progress bar */}
      <div className="w-32 h-0.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 origin-left animate-loading-bar" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-bar {
          0%   { transform: scaleX(0);    opacity: 1; }
          70%  { transform: scaleX(0.85); opacity: 1; }
          90%  { transform: scaleX(0.95); opacity: 0.8; }
          100% { transform: scaleX(1);    opacity: 0; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />
    </div>
  );
}
