'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Web Vitals Reporter
 * 
 * Reports Core Web Vitals to the console in development
 * and can be extended to send to analytics in production.
 * 
 * Usage: Add <WebVitals /> to your root layout.
 */
export function WebVitals() {
  useEffect(() => {
    function report(metric: Metric) {
      // In development, log to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
        });
      }

      // In production, you can send to your analytics endpoint
      // Example:
      // if (process.env.NODE_ENV === 'production') {
      //   const body = JSON.stringify({
      //     name: metric.name,
      //     value: metric.value,
      //     rating: metric.rating,
      //     delta: metric.delta,
      //     id: metric.id,
      //     page: window.location.pathname,
      //   });
      //   const blob = new Blob([body], { type: 'application/json' });
      //   navigator.sendBeacon('/api/vitals', blob);
      // }
    }

    onCLS(report);
    onINP(report);
    onFCP(report);
    onLCP(report);
    onTTFB(report);
  }, []);

  return null;
}
