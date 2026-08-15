'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { DeleteIconButton } from '@/features/admin/components/action-buttons';

interface Props {
  id: string;
  name: string;
  editHref: string;
}

export function SellerProductActions({ id, name, editHref }: Props) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={editHref}
        aria-label="ویرایش"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      <DeleteIconButton
        endpoint={`/api/seller/products/${id}`}
        confirmMessage={`محصول «${name}» حذف شود؟`}
      />
    </div>
  );
}
