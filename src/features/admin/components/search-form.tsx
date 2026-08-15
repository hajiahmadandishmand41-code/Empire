'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchFormProps {
  placeholder?: string;
  paramName?: string;
}

export function SearchForm({ placeholder = 'جستجو…', paramName = 'q' }: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams?.get(paramName) ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (value.trim()) params.set(paramName, value.trim());
    else params.delete(paramName);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-sm" role="search">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="ps-9"
      />
    </form>
  );
}
