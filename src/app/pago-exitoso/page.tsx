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

function PagoExitosoContent() {
  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
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
          throw new Error(json.error || 'No se pudo sincronizar el pago');
        }

        setSyncStatus('synced');
        setSyncMessage(
          json.status === 'already_registered'
            ? 'El pago ya estaba registrado en tu historial.'
            : 'El pago fue sincronizado correctamente con tu historial.'
        );
      } catch (error: any) {
        setSyncStatus('error');
        setSyncMessage(
          error.message ||
            'El pago fue aprobado en Stripe, pero no se pudo sincronizar automáticamente. Avisá a administración.'
        );
      }
    };

    confirmarPago();
  }, [isAuthenticated, isInitialized, sessionId, syncStatus]);

  const redirectTarget = useMemo(() => {
    if (user?.rol === 'socio') return '/dashboard/mi-cuenta/historial-pagos';
    if (user?.rol === 'admin' || user?.rol === 'usuario') return '/dashboard/pagos';
    return '/dashboard';
  }, [user?.rol]);

  const redirectLabel = useMemo(() => {
    if (user?.rol === 'socio') return 'Ver historial de pagos';
    if (user?.rol === 'admin' || user?.rol === 'usuario') return 'Ir a pagos';
    return 'Ir al dashboard';
  }, [user?.rol]);

  if (!isInitialized) {
    return (
      <div className='flex items-center justify-center h-screen'>
        Procesando pago...
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
          <AppHeader title='Pago Exitoso' />
          <main className='flex items-center justify-center flex-1 p-6'>
            <Card className='w-full max-w-md mx-auto shadow-lg bg-card text-card-foreground'>
              <CardHeader className='flex flex-col items-center gap-2 p-6'>
                <CheckCircle className='w-16 h-16 text-green-500 dark:text-green-400' />
                <h2 className='text-2xl font-bold text-center text-green-600 dark:text-green-400'>
                  ¡Pago realizado con éxito!
                </h2>
              </CardHeader>
              <CardContent className='flex flex-col items-center gap-4 p-6'>
                <p className='text-lg text-center text-gray-700 dark:text-gray-200'>
                  Tu pago de cuota fue procesado correctamente por Stripe.
                </p>
                <p className='text-sm text-center text-gray-500 dark:text-gray-400'>
                  Estamos sincronizando el registro para que puedas verlo en tu historial.
                </p>

                {syncStatus === 'syncing' && (
                  <div className='flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Sincronizando pago con Gym Master...
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
                    <strong>ID de sesión Stripe:</strong> {sessionId}
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
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-screen'>
          Procesando pago...
        </div>
      }
    >
      <PagoExitosoContent />
    </Suspense>
  );
}
