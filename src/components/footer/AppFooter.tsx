'use client';

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export const AppFooter = () => {
  const { locale, t } = useI18n();
  const translated = t('footer.developedBy');
  const label =
    translated === 'footer.developedBy'
      ? locale === 'en'
        ? 'Developed by DRAGONPYRAMID'
        : 'Desarrollado por DRAGONPYRAMID'
      : translated;

  return (
    <footer className='mt-auto w-full shrink-0 border-t py-4 text-center text-sm text-muted-foreground'>
      {label}
    </footer>
  );
};
