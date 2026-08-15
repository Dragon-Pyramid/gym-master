'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  FileQuestion,
  Inbox,
  RefreshCcw,
} from 'lucide-react';

import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export type AppStateVariant = 'empty' | 'error' | 'notFound' | 'loading';

type AppStateProps = {
  variant: AppStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

const stateConfig = {
  empty: {
    titleKey: 'common.states.empty.title',
    descriptionKey: 'common.states.empty.description',
    icon: Inbox,
  },
  error: {
    titleKey: 'common.states.error.title',
    descriptionKey: 'common.states.error.description',
    icon: AlertTriangle,
  },
  notFound: {
    titleKey: 'common.states.notFound.title',
    descriptionKey: 'common.states.notFound.description',
    icon: FileQuestion,
  },
} as const;

export function AppState({
  variant,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: AppStateProps) {
  const { t } = useI18n();

  if (variant === 'loading') {
    return (
      <section
        className={cn(
          'mx-auto w-full max-w-2xl px-4 py-8',
          className,
        )}
        aria-live='polite'
        aria-busy='true'
      >
        <Card>
          <CardHeader className='space-y-3'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-full max-w-md' />
          </CardHeader>

          <CardContent className='space-y-3'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
            <span className='sr-only'>
              {t('common.states.loading.description')}
            </span>
          </CardContent>
        </Card>
      </section>
    );
  }

  const config = stateConfig[variant];
  const Icon = config.icon;

  const resolvedTitle = title ?? t(config.titleKey);
  const resolvedDescription =
    description ?? t(config.descriptionKey);

  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-10',
        className,
      )}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <Card className='w-full text-center'>
        <CardHeader className='items-center'>
          <div
            className={cn(
              'mb-2 flex h-14 w-14 items-center justify-center rounded-full',
              variant === 'error'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className='h-7 w-7' aria-hidden='true' />
          </div>

          <CardTitle className='text-xl sm:text-2xl'>
            {resolvedTitle}
          </CardTitle>

          <CardDescription className='max-w-lg leading-6'>
            {resolvedDescription}
          </CardDescription>
        </CardHeader>

        {(actionHref || onAction) && (
          <CardContent className='flex justify-center'>
            {actionHref ? (
              <Button asChild>
                <Link href={actionHref}>
                  {actionLabel ?? t('common.states.actions.backHome')}
                </Link>
              </Button>
            ) : (
              <Button type='button' onClick={onAction}>
                <RefreshCcw className='h-4 w-4' aria-hidden='true' />
                {actionLabel ?? t('common.states.actions.retry')}
              </Button>
            )}
          </CardContent>
        )}
      </Card>
    </section>
  );
}
