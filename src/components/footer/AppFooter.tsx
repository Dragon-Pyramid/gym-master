'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';

interface AppFooterProps {
  className?: string;
}

export const AppFooter = ({ className }: AppFooterProps) => {
  const { locale, t } = useI18n();
  const translated = t('footer.developedBy');
  const label =
    translated === 'footer.developedBy'
      ? locale === 'en'
        ? 'Developed by DRAGONPYRAMID'
        : 'Desarrollado por DRAGONPYRAMID'
      : translated;

  return (
    <footer
      className={cn(
        'gm-dashboard-footer mt-auto w-full shrink-0 border-t bg-background py-4 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      {label}
    </footer>
  );
};
