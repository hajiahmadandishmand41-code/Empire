/**
 * EShop — Reusable animation variants & helpers using Motion.
 *
 * All variants honour `prefers-reduced-motion` via MotionConfig.
 * Import from '@/lib/motion' instead of 'motion/react' directly to
 * keep animation behaviour consistent across the entire storefront.
 *
 * @see https://motion.dev/docs/react-quick-start
 */

// ─── Fade-in variants ────────────────────────────────────────────────

/** Simple opacity fade. */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
} as const;

/** Fade + slide up (most common entrance in the shop). */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
} as const;

/** Fade + slide down. */
export const fadeDown = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
} as const;

/** Fade + slide from left (LTR: content appears from left). */
export const fadeLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
} as const;

/** Fade + slide from right. */
export const fadeRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
} as const;

// ─── Scale variants ──────────────────────────────────────────────────

/** Subtle scale-in (good for cards, modals). */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
} as const;

// ─── Stagger containers ──────────────────────────────────────────────

/** Parent variant that staggers children using any child variant above. */
export const staggerContainer = (staggerMs = 60, delayMs = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerMs / 1000, delayChildren: delayMs / 1000 },
  },
});

/** Parent variant for fast stagger (e.g. product grids). */
export const staggerFast = () => staggerContainer(40, 0);

/** Parent variant for slow stagger (e.g. hero sections). */
export const staggerSlow = () => staggerContainer(100, 100);

// ─── Hover / tap interactions ────────────────────────────────────────

/** Gentle lift on hover — use with `whileHover`. */
export const hoverLift = { y: -2, transition: { duration: 0.2, ease: 'easeOut' } } as const;

/** Press-down on tap — use with `whileTap`. */
export const tapPress = { scale: 0.97 } as const;

// ─── Page transition ─────────────────────────────────────────────────

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
} as const;
