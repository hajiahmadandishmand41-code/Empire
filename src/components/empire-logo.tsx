/**
 * EmpireShop Logo — "E" with Royal Crown
 * Minimal, vector SVG, works on light and dark backgrounds.
 */

interface EmpireLogoProps {
  size?: number;
  className?: string;
  /** 'color' = rose gradient (default) | 'white' = all white | 'dark' = dark background */
  variant?: 'color' | 'white' | 'dark';
}

export function EmpireLogo({ size = 40, className = '', variant = 'color' }: EmpireLogoProps) {
  const gradId = `empire-grad-${variant}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={variant === 'white' ? '#ffffff' : '#E01850'} />
          <stop offset="100%" stopColor={variant === 'white' ? '#ffffff' : '#9B3FA8'} />
        </linearGradient>
      </defs>

      {/* Background circle */}
      {variant !== 'color' ? null : (
        <rect width="40" height="40" rx="10" fill={`url(#${gradId})`} />
      )}

      {/* Crown — sits above the E */}
      <g transform="translate(7, 4)">
        {/* Crown base bar */}
        <rect
          x="1"
          y="11"
          width="24"
          height="3"
          rx="1.5"
          fill={variant === 'color' ? '#fff' : `url(#${gradId})`}
        />
        {/* Left point */}
        <polygon
          points="1,11 1,4 6,8"
          fill={variant === 'color' ? 'rgba(255,255,255,0.9)' : `url(#${gradId})`}
        />
        {/* Center point (tallest) */}
        <polygon
          points="13,11 8,4 18,4"
          fill={variant === 'color' ? '#fff' : `url(#${gradId})`}
        />
        {/* Right point */}
        <polygon
          points="25,11 25,4 20,8"
          fill={variant === 'color' ? 'rgba(255,255,255,0.9)' : `url(#${gradId})`}
        />
        {/* Crown gems */}
        <circle cx="1" cy="4" r="1.5" fill={variant === 'color' ? '#FFE066' : '#E01850'} />
        <circle cx="13" cy="3.5" r="1.8" fill={variant === 'color' ? '#FFE066' : '#E01850'} />
        <circle cx="25" cy="4" r="1.5" fill={variant === 'color' ? '#FFE066' : '#E01850'} />
      </g>

      {/* Letter E */}
      <g transform="translate(10, 17)">
        <rect x="0" y="0" width="4" height="18" rx="2"
          fill={variant === 'color' ? '#fff' : `url(#${gradId})`}
        />
        <rect x="0" y="0" width="17" height="4" rx="2"
          fill={variant === 'color' ? '#fff' : `url(#${gradId})`}
        />
        <rect x="0" y="7" width="13" height="4" rx="2"
          fill={variant === 'color' ? 'rgba(255,255,255,0.85)' : `url(#${gradId})`}
        />
        <rect x="0" y="14" width="17" height="4" rx="2"
          fill={variant === 'color' ? '#fff' : `url(#${gradId})`}
        />
      </g>
    </svg>
  );
}
