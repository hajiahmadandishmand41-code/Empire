'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

interface AdminErrorProps { error: Error & { digest?: string }; reset: () => void }

export default function AdminError({ error, reset }: AdminErrorProps) {
  const t = useTranslations('admin.errors');
  React.useEffect(() => { console.error('[admin] page error', error); }, [error]);
  return <div className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center"><div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/50 dark:bg-gray-950"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">!</div><h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('description')}</p>{process.env.NODE_ENV !== 'production' && error?.message && <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-gray-50 p-3 text-start text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">{error.message}</pre>}<button type="button" onClick={reset} className="mt-6 inline-flex h-10 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700">{t('retry')}</button></div></div>;
}
