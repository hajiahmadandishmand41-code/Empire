'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ImportResult {
  id: string;
  status: string;
  totalRows: number;
  processedRows: number;
  createdRows: number;
  failedRows?: number;
  skippedRows?: number;
  resumed?: boolean;
}

export function ProductImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!result?.id || result.status === 'completed' || result.status === 'failed') return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/seller/products/import/status?id=${encodeURIComponent(result.id)}`, { cache: 'no-store' });
        const body = await response.json();
        if (response.ok && body.ok) {
          const next = body.data as ImportResult;
          setResult({ ...next, skippedRows: next.processedRows - next.createdRows - (next.failedRows ?? 0) });
        }
      } catch {
        // Keep showing the last known progress; the background worker continues independently.
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [result?.id, result?.status]);

  async function submit() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError('ابتدا فایل CSV را انتخاب کنید.');
      return;
    }
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/seller/products/import', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Import ناموفق بود.');
      const initial = body.data as ImportResult;
      setResult({ ...initial, skippedRows: initial.processedRows - initial.createdRows - (initial.failedRows ?? 0) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در Import محصولات');
    } finally {
      setBusy(false);
    }
  }

  const percent = result && result.totalRows > 0
    ? Math.min(100, Math.round((result.processedRows / result.totalRows) * 100))
    : 0;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-semibold">Import انبوه محصولات</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              حداکثر ۱۰٬۰۰۰ محصول در هر فایل. پردازش در پس‌زمینه انجام می‌شود و با بسته‌شدن مرورگر متوقف نمی‌شود.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              <FileText className="h-4 w-4" /> انتخاب CSV
            </Button>
            <Button type="button" variant="primary" disabled={busy || !fileName} onClick={submit}>
              <Upload className="h-4 w-4" /> {busy ? 'در حال آماده‌سازی…' : 'شروع Import'}
            </Button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && result.status !== 'completed' && result.status !== 'failed' && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                در حال پردازش پس‌زمینه: {result.processedRows.toLocaleString()} از {result.totalRows.toLocaleString()}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{percent}% — این فرایند مستقل از باز بودن صفحه ادامه دارد.</p>
            </div>
          )}

          {result?.status === 'completed' && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium">Import کامل شد.</p>
                <p className="mt-1 text-muted-foreground">
                  {result.createdRows.toLocaleString()} محصول ثبت شد؛ {(result.skippedRows ?? 0).toLocaleString()} مورد تکراری و {(result.failedRows ?? 0).toLocaleString()} مورد ناموفق.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold">ستون‌های CSV</h3>
        <p className="mt-2 text-sm text-muted-foreground font-mono leading-7">
          slug,name,shortDescription,description,price,compareAtPrice,categoryId,region,currency,inStock,isActive,stockQuantity,whatsappNumber,videoUrl,isTraditional,weightKg,dimensionsJson,tagsJson,attributesJson
        </p>
      </Card>
    </div>
  );
}
