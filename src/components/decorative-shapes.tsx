/**
 * Decorative geometric shapes.
 *
 * Marketplace tiles look broken when an image is missing — a grey box with a
 * generic icon reads as "failed to load" rather than "no photo yet". These
 * shapes give every brand, store, category and product tile a deliberate,
 * colourful graphic instead.
 *
 * The palette and pattern are chosen *deterministically* from a seed string
 * (a slug or id), so the same brand always gets the same look on every render
 * and between server and client — no hydration mismatch, no random flicker.
 */

const PALETTES = [
  { from: '#E01850', to: '#FF7A9B', ink: '#FFFFFF' }, // brand rose
  { from: '#7C4DFF', to: '#B894FF', ink: '#FFFFFF' }, // violet
  { from: '#0EA5E9', to: '#67D8F8', ink: '#FFFFFF' }, // sky
  { from: '#F59E0B', to: '#FCD34D', ink: '#3B2200' }, // amber
  { from: '#10B981', to: '#6EE7B7', ink: '#03301F' }, // emerald
  { from: '#F43F5E', to: '#FDA4AF', ink: '#FFFFFF' }, // pink
  { from: '#6366F1', to: '#A5B4FC', ink: '#FFFFFF' }, // indigo
  { from: '#14B8A6', to: '#5EEAD4', ink: '#02322D' }, // teal
] as const;

/** Stable, non-cryptographic hash so a seed maps to the same visuals always. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function paletteFor(seed: string) {
  return PALETTES[hashSeed(seed) % PALETTES.length];
}

type PatternProps = { seed: string; className?: string; rounded?: boolean };

/**
 * Full-bleed patterned background — used behind category tiles, brand logos,
 * store avatars and image-less product cards.
 */
export function ShapePattern({ seed, className = '', rounded = false }: PatternProps) {
  const palette = paletteFor(seed);
  const variant = hashSeed(seed) % 4;
  const gradientId = `shape-grad-${hashSeed(seed)}`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={`h-full w-full ${rounded ? 'rounded-full' : ''} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradientId})`} />

      {variant === 0 && (
        <g fill="#fff" opacity="0.22">
          <circle cx="78" cy="24" r="26" />
          <circle cx="22" cy="80" r="18" opacity="0.7" />
        </g>
      )}
      {variant === 1 && (
        <g stroke="#fff" strokeWidth="6" fill="none" opacity="0.25">
          <circle cx="50" cy="50" r="34" />
          <circle cx="50" cy="50" r="18" />
        </g>
      )}
      {variant === 2 && (
        <g fill="#fff" opacity="0.2">
          <polygon points="0,100 46,26 92,100" />
          <polygon points="52,100 82,52 100,100" opacity="0.75" />
        </g>
      )}
      {variant === 3 && (
        <g fill="#fff" opacity="0.18">
          {[18, 42, 66, 90].map((y) =>
            [14, 38, 62, 86].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />),
          )}
        </g>
      )}
    </svg>
  );
}

/**
 * Shape background with the seed's initial letter on top. This is the
 * fallback for brands and stores that have not uploaded a logo.
 */
export function ShapeMonogram({
  seed,
  label,
  className = '',
  rounded = true,
}: {
  seed: string;
  label: string;
  className?: string;
  rounded?: boolean;
}) {
  const palette = paletteFor(seed);
  const initial = label.trim().charAt(0) || '•';

  return (
    <span className={`relative block overflow-hidden ${rounded ? 'rounded-full' : 'rounded-2xl'} ${className}`}>
      <ShapePattern seed={seed} rounded={rounded} />
      <span
        className="absolute inset-0 flex items-center justify-center text-[45%] font-black leading-none drop-shadow-sm"
        style={{ color: palette.ink }}
        aria-hidden="true"
      >
        {initial}
      </span>
    </span>
  );
}

/**
 * Soft blurred blobs for section backgrounds. Purely decorative depth so
 * large flat bands (hero strips, promos) do not read as empty rectangles.
 */
export function ShapeBackdrop({ seed = 'eshop', className = '' }: { seed?: string; className?: string }) {
  const palette = paletteFor(seed);
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="absolute -end-16 -top-20 h-56 w-56 rounded-full opacity-[0.13] blur-3xl"
        style={{ background: palette.from }}
      />
      <div
        className="absolute -bottom-24 -start-12 h-56 w-56 rounded-full opacity-[0.10] blur-3xl"
        style={{ background: palette.to }}
      />
    </div>
  );
}
