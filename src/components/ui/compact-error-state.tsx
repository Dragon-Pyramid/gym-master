'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

type CompactErrorStateProps = {
  message?: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
};

export function CompactErrorState({
  message,
  title,
  onRetry,
  className,
}: CompactErrorStateProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center',
        className,
      )}
      role='alert'
      aria-live='assertive'
    >
      <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
        <AlertTriangle className='h-5 w-5' aria-hidden='true' />
      </div>

      <p className='font-semibold text-foreground'>
        {title ?? t('common.states.error.title')}
      </p>

      {message ? (
        <p className='mt-1 max-w-lg text-sm leading-6 text-muted-foreground'>
          {message}
        </p>
      ) : null}

      {onRetry ? (
        <Button
          type='button'
          variant='outline'
          className='mt-4'
          onClick={onRetry}
        >
          <RefreshCcw className='h-4 w-4' aria-hidden='true' />
          {t('common.states.actions.retry')}
        </Button>
      ) : null}
    </div>
  );
}
