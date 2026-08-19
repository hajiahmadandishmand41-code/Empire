/** Eshop brand mark — minimal E with a crown, rendered as inline SVG. */

interface EshopLogoProps {
  size?: number;
  className?: string;
  variant?: 'color' | 'white' | 'dark';
}

export function EshopLogo({ size = 40, className = '', variant = 'color' }: EshopLogoProps) {
  const gradId = `eshop-grad-${variant}`;
  const accent = variant === 'white' ? '#ffffff' : '#E01850';
  const main = variant === 'color' ? '#ffffff' : `url(#${gradId})`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs><linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={accent} /><stop offset="100%" stopColor={variant === 'white' ? '#ffffff' : '#9B3FA8'} /></linearGradient></defs>
      {variant === 'color' && <rect width="40" height="40" rx="10" fill={`url(#${gradId})`} />}
      <g transform="translate(7, 4)"><rect x="1" y="11" width="24" height="3" rx="1.5" fill={main} /><polygon points="1,11 1,4 6,8" fill={main} /><polygon points="13,11 8,4 18,4" fill={main} /><polygon points="25,11 25,4 20,8" fill={main} /><circle cx="1" cy="4" r="1.5" fill={variant === 'color' ? '#FFE066' : '#E01850'} /><circle cx="13" cy="3.5" r="1.8" fill={variant === 'color' ? '#FFE066' : '#E01850'} /><circle cx="25" cy="4" r="1.5" fill={variant === 'color' ? '#FFE066' : '#E01850'} /></g>
      <g transform="translate(10, 17)"><rect x="0" y="0" width="4" height="18" rx="2" fill={main} /><rect x="0" y="0" width="17" height="4" rx="2" fill={main} /><rect x="0" y="7" width="13" height="4" rx="2" fill={main} /><rect x="0" y="14" width="17" height="4" rx="2" fill={main} /></g>
    </svg>
  );
}
