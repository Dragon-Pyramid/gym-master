'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  LockKeyhole,
  Route,
  Search,
  ShieldCheck,
} from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useI18n } from '@/i18n/I18nProvider';
import {
  filterHelpManualEntries,
  getHelpCenterCopy,
  getHelpManualCategories,
  getHelpManualEntries,
  resolveHelpManualRole,
} from '@/lib/help-center/manualContent';
import { useAuthStore } from '@/stores/authStore';

export default function HelpCenterPage() {
  const { locale } = useI18n();
  const { user, isInitialized, initializeAuth } = useAuthStore();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const manualRole = resolveHelpManualRole(user?.rol);

  useEffect(() => {
    setSelectedCategory(null);
    setSelectedEntryId(null);
  }, [locale, manualRole]);
  const copy = getHelpCenterCopy(locale, manualRole ?? 'socio');

  const entries = useMemo(
    () => (manualRole ? getHelpManualEntries(manualRole, locale) : []),
    [locale, manualRole],
  );

  const categories = useMemo(() => getHelpManualCategories(entries), [entries]);
  const allCategoryLabel = copy.all;
  const activeCategory = selectedCategory ?? allCategoryLabel;

  const filteredEntries = useMemo(
    () =>
      filterHelpManualEntries({
        entries,
        query,
        category: activeCategory,
        allCategoryLabel,
      }),
    [activeCategory, allCategoryLabel, entries, query],
  );

  const selectedEntry = useMemo(
    () =>
      filteredEntries.find((entry) => entry.id === selectedEntryId) ??
      filteredEntries[0] ??
      null,
    [filteredEntries, selectedEntryId],
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedEntryId(null);
  };

  if (!isInitialized) {
    return <div className='p-6 text-sm text-muted-foreground'>{copy.pageTitle}</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className='flex min-h-screen w-full flex-col bg-background'>
        <AppHeader title={copy.pageTitle} />

        <main className='flex-1 space-y-6 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8'>
          {!manualRole ? (
            <Card className='border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <LockKeyhole className='h-5 w-5' />
                  {copy.unavailableTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm leading-6'>{copy.unavailableDescription}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <section className='overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 text-white shadow-2xl shadow-cyan-950/20 sm:p-7'>
                <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
                  <div className='max-w-3xl space-y-3'>
                    <p className='text-xs font-black uppercase tracking-[0.32em] text-cyan-300'>
                      {copy.eyebrow}
                    </p>
                    <h1 className='text-3xl font-black tracking-tight sm:text-4xl'>
                      {copy.title}
                    </h1>
                    <p className='max-w-2xl text-sm leading-6 text-slate-200'>
                      {copy.description}
                    </p>
                  </div>

                  <div className='grid min-w-[220px] gap-3 rounded-2xl border border-cyan-400/30 bg-white/10 p-4 backdrop-blur'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200'>
                        <ShieldCheck className='h-5 w-5' />
                      </div>
                      <div>
                        <p className='text-sm font-bold'>{copy.accessNoticeTitle}</p>
                        <p className='text-xs text-slate-300'>{entries.length} {copy.moduleCount}</p>
                      </div>
                    </div>
                    <p className='text-xs leading-5 text-slate-300'>{copy.accessNoticeDescription}</p>
                  </div>
                </div>
              </section>

              <section className='grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]'>
                <Card className='h-fit border-border bg-card/95'>
                  <CardHeader className='space-y-4'>
                    <div>
                      <CardTitle className='flex items-center gap-2 text-lg'>
                        <BookOpen className='h-5 w-5 text-cyan-500' />
                        {copy.indexTitle}
                      </CardTitle>
                    </div>

                    <div className='relative'>
                      <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                      <Input
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setSelectedEntryId(null);
                        }}
                        placeholder={copy.searchPlaceholder}
                        className='pl-9'
                        aria-label={copy.quickSearch}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-4'>
                    <div className='flex flex-wrap gap-2'>
                      {[allCategoryLabel, ...categories].map((category) => (
                        <Button
                          key={category}
                          type='button'
                          size='sm'
                          variant={activeCategory === category ? 'default' : 'outline'}
                          onClick={() => handleCategoryChange(category)}
                          className='rounded-full'
                        >
                          {category}
                        </Button>
                      ))}
                    </div>

                    <div className='max-h-[540px] space-y-2 overflow-y-auto pr-1'>
                      {filteredEntries.map((entry) => (
                        <button
                          key={entry.id}
                          type='button'
                          onClick={() => setSelectedEntryId(entry.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition hover:border-cyan-400 hover:bg-cyan-500/10 ${
                            selectedEntry?.id === entry.id
                              ? 'border-cyan-400 bg-cyan-500/10'
                              : 'border-border bg-background'
                          }`}
                        >
                          <p className='text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-300'>
                            {entry.category}
                          </p>
                          <p className='mt-1 font-semibold'>{entry.title}</p>
                          <p className='mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground'>
                            {entry.summary}
                          </p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className='min-h-[560px] border-border bg-card/95'>
                  {selectedEntry ? (
                    <>
                      <CardHeader className='space-y-3 border-b'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300'>
                            {selectedEntry.category}
                          </span>
                          <span className='inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground'>
                            <HelpCircle className='h-3.5 w-3.5' />
                            {copy.eyebrow}
                          </span>
                        </div>
                        <div>
                          <CardTitle className='text-2xl font-black tracking-tight'>
                            {selectedEntry.title}
                          </CardTitle>
                          <p className='mt-2 max-w-3xl text-sm leading-6 text-muted-foreground'>
                            {selectedEntry.summary}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className='space-y-6 p-5 sm:p-6'>
                        <section>
                          <h2 className='mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-muted-foreground'>
                            <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                            {copy.steps}
                          </h2>
                          <ol className='space-y-3'>
                            {selectedEntry.steps.map((step, index) => (
                              <li key={step} className='flex gap-3 rounded-2xl border bg-background p-3'>
                                <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-black text-white'>
                                  {index + 1}
                                </span>
                                <span className='text-sm leading-6'>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </section>

                        {selectedEntry.tips.length > 0 ? (
                          <section className='rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-50'>
                            <h2 className='mb-2 flex items-center gap-2 text-sm font-bold'>
                              <FileText className='h-4 w-4' />
                              {copy.tips}
                            </h2>
                            <ul className='space-y-2 text-sm leading-6'>
                              {selectedEntry.tips.map((tip) => (
                                <li key={tip}>• {tip}</li>
                              ))}
                            </ul>
                          </section>
                        ) : null}

                        {selectedEntry.relatedPaths.length > 0 ? (
                          <section>
                            <h2 className='mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-muted-foreground'>
                              <Route className='h-4 w-4 text-cyan-500' />
                              {copy.relatedPaths}
                            </h2>
                            <div className='flex flex-wrap gap-2'>
                              {selectedEntry.relatedPaths.map((path) => (
                                <span
                                  key={path}
                                  className='rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground'
                                >
                                  {path}
                                </span>
                              ))}
                            </div>
                          </section>
                        ) : null}
                      </CardContent>
                    </>
                  ) : (
                    <div className='flex min-h-[520px] flex-col items-center justify-center p-8 text-center'>
                      <Search className='mb-4 h-10 w-10 text-muted-foreground' />
                      <h2 className='text-xl font-bold'>{copy.noResultsTitle}</h2>
                      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
                        {copy.noResultsDescription}
                      </p>
                    </div>
                  )}
                </Card>
              </section>
            </>
          )}
        </main>

        <AppFooter />
      </div>
    </SidebarProvider>
  );
}
