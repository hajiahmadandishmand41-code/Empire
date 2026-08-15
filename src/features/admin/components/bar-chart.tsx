import * as React from 'react';
import { cn } from '@/lib/utils';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  formatValue?: (v: number) => string;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Lightweight, dependency-free bar chart for the admin dashboard.
 * Renders each bar as a flex-child scaled by percentage of the max.
 */
export function BarChart({ data, formatValue, height = 160, className, ariaLabel }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn('w-full', className)} role="img" aria-label={ariaLabel ?? 'chart'}>
      <div
        className="flex items-end gap-1 rounded-md border border-border bg-background p-3"
        style={{ height }}
      >
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={`${d.label}-${i}`}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${d.label}: ${formatValue ? formatValue(d.value) : d.value}`}
            >
              <div
                className="w-full min-w-[4px] rounded-t bg-primary/80 transition-all group-hover:bg-primary"
                style={{ height: `${Math.max(2, pct)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 text-[10px] text-muted-foreground">
        {data.map((d, i) => (
          <div key={`${d.label}-lbl-${i}`} className="flex-1 truncate text-center">
            {i % Math.ceil(data.length / 7) === 0 ? d.label.slice(5) : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
