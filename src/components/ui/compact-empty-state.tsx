import { Inbox, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type CompactEmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
};

export function CompactEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: CompactEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center',
        className,
      )}
      role='status'
      aria-live='polite'
    >
      <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <Icon className='h-5 w-5' aria-hidden='true' />
      </div>

      <p className='font-semibold text-foreground'>
        {title}
      </p>

      {description ? (
        <p className='mt-1 max-w-lg text-sm leading-6 text-muted-foreground'>
          {description}
        </p>
      ) : null}
    </div>
  );
}
