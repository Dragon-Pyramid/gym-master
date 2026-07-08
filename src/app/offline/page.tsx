'use client';

import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export default function OfflinePage() {
  const { t } = useI18n();

  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-950 px-4 py-[calc(2.5rem+env(safe-area-inset-top))] text-white'>
      <section className='w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl'>
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-400/15 text-amber-200'>
          <WifiOff className='h-7 w-7' aria-hidden='true' />
        </div>

        <h1 className='mt-5 text-2xl font-black tracking-tight'>{t('publicPages.offline.title')}</h1>
        <p className='mt-3 text-sm leading-6 text-slate-200'>
          {t('publicPages.offline.description')}
        </p>

        <div className='mt-6 grid gap-3'>
          <Link
            href='/dashboard'
            className='rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100'
          >
            {t('publicPages.offline.home')}
          </Link>
          <button
            type='button'
            className='rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10'
            onClick={() => window.location.reload()}
          >
            {t('publicPages.offline.retry')}
          </button>
        </div>
      </section>
    </main>
  );
}
