'use client';

import { useEffect } from 'react';

import { AppState } from '@/components/ui/app-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error', {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className='flex min-h-[70vh] items-center justify-center bg-background'>
      <AppState
        variant='error'
        onAction={reset}
      />
    </main>
  );
}
