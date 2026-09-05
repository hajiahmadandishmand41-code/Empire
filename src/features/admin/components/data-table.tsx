import * as React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({ columns, rows, rowKey, emptyMessage = 'موردی برای نمایش وجود ندارد.', className }: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-border/60 bg-card', className)}>
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-start">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn('px-4 py-3 text-start text-[11px] font-bold uppercase tracking-wide text-muted-foreground', c.headerClassName)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-14 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/20">
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 align-middle', c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
