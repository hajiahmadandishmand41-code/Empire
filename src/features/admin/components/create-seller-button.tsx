'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
import { CreateSellerDialog } from './create-seller-dialog';

export function CreateSellerButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-all hover:-translate-y-0.5 shadow-sm active:scale-95"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        ایجاد فروشنده
      </button>
      {open && <CreateSellerDialog onClose={() => setOpen(false)} />}
    </>
  );
}
