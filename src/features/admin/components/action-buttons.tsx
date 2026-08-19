'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AddButton({ label, href, onClick }: { label: string; href?: string; onClick?: () => void }) {
  if (href) {
    return <Button asChild size="sm" variant="primary"><Link href={href}><Plus className="h-4 w-4" />{label}</Link></Button>;
  }
  return <Button size="sm" variant="primary" onClick={onClick ?? (() => toast(label))}><Plus className="h-4 w-4" />{label}</Button>;
}

export function EditIconButton({ href, onClick, label = 'Edit' }: { href?: string; onClick?: () => void; label?: string }) {
  const content = <Pencil className="h-3.5 w-3.5" />;
  if (href) return <Link href={href} aria-label={label} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted">{content}</Link>;
  return <button type="button" onClick={onClick} aria-label={label} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted">{content}</button>;
}

interface DeleteIconButtonProps { endpoint: string; confirmMessage?: string; labels?: { deleted?: string; failed?: string; network?: string; aria?: string } }

export function DeleteIconButton({ endpoint, confirmMessage, labels }: DeleteIconButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  async function onDelete() {
    if (typeof window !== 'undefined' && !window.confirm(confirmMessage ?? 'Delete this item?')) return;
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: 'DELETE', credentials: 'same-origin' });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) toast.error(body?.error?.message ?? labels?.failed ?? 'Delete failed');
      else { toast.success(labels?.deleted ?? 'Deleted successfully'); router.refresh(); }
    } catch { toast.error(labels?.network ?? 'Network error'); }
    finally { setBusy(false); }
  }
  return <button type="button" disabled={busy} onClick={onDelete} aria-label={labels?.aria ?? 'Delete'} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>;
}
