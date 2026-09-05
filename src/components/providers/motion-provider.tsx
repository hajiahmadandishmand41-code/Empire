'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

/**
 * Global Motion configuration wrapper.
 *
 * • Automatically reduces/disables animations when the user's OS
 *   is set to "prefers-reduced-motion: reduce".
 * • Sets a consistent transition duration across the entire app.
 * • Place once in the locale layout — all `motion.*` components
 *   inside will inherit the config.
 *
 * @see https://motion.dev/docs/react-motion-config
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: 'easeOut' }}>
      {children}
    </MotionConfig>
  );
}
