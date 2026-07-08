'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, localeOption, options, isHydrated, setLocale, t } = useI18n();
  const nextOption = options.find((option) => option.code !== locale) ?? options[0];

  if (compact) {
    return (
      <Button
        type='button'
        variant='ghost'
        className='h-9 gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground'
        onClick={() => setLocale(nextOption.code)}
        aria-label={`${t('common.changeLanguage')}: ${nextOption.nativeLabel}`}
        title={`${t('common.currentLanguage')}: ${localeOption.nativeLabel}`}
      >
        <Languages className='h-4 w-4' />
        <span className='hidden sm:inline' suppressHydrationWarning>
          {isHydrated ? locale.toUpperCase() : 'ES'}
        </span>
      </Button>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {options.map((option) => {
        const selected = option.code === locale;
        const displaySelected = isHydrated ? selected : option.code === 'es';

        return (
          <button
            key={option.code}
            type='button'
            onClick={() => setLocale(option.code)}
            className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
              displaySelected
                ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                : 'border-border bg-background text-foreground hover:bg-muted'
            }`}
            aria-pressed={displaySelected}
          >
            <span aria-hidden='true'>{option.flag}</span> {option.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
