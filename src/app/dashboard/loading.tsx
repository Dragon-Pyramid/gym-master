import { AppState } from '@/components/ui/app-state';

export default function DashboardLoading() {
  return (
    <main className='flex min-h-[70vh] items-center justify-center bg-background'>
      <AppState variant='loading' />
    </main>
  );
}
