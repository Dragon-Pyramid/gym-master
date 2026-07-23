'use client';

import { useEffect, Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { getToken } from '@/services/storageService';
import { useI18n } from '@/i18n/I18nProvider';

function PagoExitosoContent() {
  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>(
    sessionId ? 'idle' : 'synced'
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !sessionId || syncStatus !== 'idle') {
      return;
    }

    const confirmarPago = async () => {
      try {
        setSyncStatus('syncing');
        const token = getToken();
        const res = await fetch('/api/pagar-cuota/confirmar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const json = await res.json();

        if (!res.ok) {
          console.error('Payment confirmation failed', json.error);
          throw new Error(t('publicPages.paymentSuccess.syncFailed'));
        }

        setSyncStatus('synced');
        setSyncMessage(
          json.status === 'already_registered'
            ? t('publicPages.paymentSuccess.alreadyRegistered')
            : t('publicPages.paymentSuccess.synced')
        );
      } catch (error: any) {
        setSyncStatus('error');
        setSyncMessage(
          error?.message === t('publicPages.paymentSuccess.syncFailed')
            ? error.message
            : t('publicPages.paymentSuccess.syncFallbackError')
        );
      }
    };

    confirmarPago();
  }, [isAuthenticated, isInitialized, sessionId, syncStatus, t]);

  const redirectTarget = useMemo(() => {
    if (user?.rol === 'socio') return '/dashboard/mi-cuenta/historial-pagos';
    if (user?.rol === 'admin' || user?.rol === 'usuario') return '/dashboard/pagos';
    return '/dashboard';
  }, [user?.rol]);

  const redirectLabel = useMemo(() => {
    if (user?.rol === 'socio') return t('publicPages.paymentSuccess.viewHistory');
    if (user?.rol === 'admin' || user?.rol === 'usuario') {
      return t('publicPages.paymentSuccess.goToPayments');
    }
    return t('publicPages.paymentSuccess.goToDashboard');
  }, [t, user?.rol]);

  if (!isInitialized) {
    return (
      <div className='flex items-center justify-center h-screen'>
        {t('publicPages.payment.processing')}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen bg-background text-foreground'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={t('publicPages.paymentSuccess.headerTitle')} />
          <main className='flex items-center justify-center flex-1 p-6'>
            <Card className='w-full max-w-md mx-auto shadow-lg bg-card text-card-foreground'>
              <CardHeader className='flex flex-col items-center gap-2 p-6'>
                <CheckCircle className='w-16 h-16 text-green-500 dark:text-green-400' />
                <h2 className='text-2xl font-bold text-center text-green-600 dark:text-green-400'>
                  {t('publicPages.paymentSuccess.title')}
                </h2>
              </CardHeader>
              <CardContent className='flex flex-col items-center gap-4 p-6'>
                <p className='text-lg text-center text-gray-700 dark:text-gray-200'>
                  {t('publicPages.paymentSuccess.description')}
                </p>
                <p className='text-sm text-center text-gray-500 dark:text-gray-400'>
                  {t('publicPages.paymentSuccess.syncDescription')}
                </p>

                {syncStatus === 'syncing' && (
                  <div className='flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {t('publicPages.paymentSuccess.syncing')}
                  </div>
                )}

                {syncStatus === 'synced' && syncMessage && (
                  <div className='rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700'>
                    {syncMessage}
                  </div>
                )}

                {syncStatus === 'error' && syncMessage && (
                  <div className='flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800'>
                    <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
                    <span>{syncMessage}</span>
                  </div>
                )}

                {sessionId && (
                  <div className='w-full p-2 mt-2 text-xs text-center text-gray-700 bg-gray-100 rounded break-all'>
                    <strong>{t('publicPages.payment.stripeSessionId')}</strong> {sessionId}
                  </div>
                )}
                <button
                  className='mt-4 px-6 py-2 bg-[#02a8e1] text-white rounded hover:bg-[#0288b1] dark:bg-[#0288b1] dark:text-white dark:hover:bg-[#02a8e1] disabled:cursor-not-allowed disabled:opacity-60'
                  disabled={syncStatus === 'syncing'}
                  onClick={() => router.push(redirectTarget)}
                >
                  {redirectLabel}
                </button>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default function PagoExitosoPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-screen'>
          {t('publicPages.payment.processing')}
        </div>
      }
    >
      <PagoExitosoContent />
    </Suspense>
  );
}
