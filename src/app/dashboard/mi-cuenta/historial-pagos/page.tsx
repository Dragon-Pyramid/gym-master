'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, CreditCard, Loader2, ReceiptText } from 'lucide-react';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getToken } from '@/services/storageService';
import { useAuthStore } from '@/stores/authStore';
import { descargarPagoReciboPdf } from '@/utils/pagoReciboPdf';
import type { ResponsePago } from '@/interfaces/pago.interface';

type PagoSocio = {
  id: string;
  fecha_pago: string;
  fecha_vencimiento: string | null;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  meses_cubiertos: number | null;
  monto_pagado: number;
  total: number | null;
  metodo_pago: string | null;
  estado: string | null;
  observaciones: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  enviar_email?: boolean;
  socio: {
    id_socio: string;
    nombre_completo: string;
    email?: string | null;
  } | null;
  cuota: {
    id: string;
    descripcion: string;
    periodo?: string | null;
    monto?: number | null;
  } | null;
  registrado_por: {
    id: string;
    nombre: string;
  } | null;
};

function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR');
}

function label(value?: string | null) {
  if (!value) return '-';
  if (value === 'stripe') return 'Stripe';
  if (value === 'efectivo') return 'Efectivo';
  if (value === 'pagado') return 'Pagado';
  if (value === 'cancelado') return 'Cancelado';
  return value;
}

function badgeClass(value?: string | null) {
  if (value === 'pagado') return 'bg-green-100 text-green-700 border-green-200';
  if (value === 'stripe') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  if (value === 'efectivo') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (value === 'cancelado') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-muted text-muted-foreground border-border';
}

export default function HistorialPagosSocioPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const [pagos, setPagos] = useState<PagoSocio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadPagos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch('/api/mi-cuenta/pagos', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo obtener el historial de pagos');
      setPagos(json.data ?? []);
    } catch (error: any) {
      toast.error(error.message || 'Error al obtener el historial de pagos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadPagos();
    }
  }, [isInitialized, isAuthenticated]);

  const handleDownloadReceipt = async (pago: PagoSocio) => {
    try {
      if (!pago.socio) {
        throw new Error('No se encontraron los datos del socio para generar el recibo');
      }

      await descargarPagoReciboPdf({
        ...pago,
        enviar_email: pago.enviar_email ?? false,
        socio: pago.socio,
        cuota: pago.cuota ?? {
          id: '',
          descripcion: 'Cuota',
          monto: pago.monto_pagado,
          periodo: null,
        },
        registrado_por: pago.registrado_por ?? null,
      } as ResponsePago);

      toast.success('Recibo PDF generado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'No se pudo generar el recibo PDF');
    }
  };

  const totalPagado = useMemo(
    () => pagos.reduce((acc, pago) => acc + Number(pago.monto_pagado ?? 0), 0),
    [pagos]
  );

  if (!isInitialized) {
    return <div className='flex items-center justify-center min-h-screen'>Cargando...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen bg-background text-foreground'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Historial de pagos' />
          <main className='flex-1 p-6 space-y-6'>
            <Card>
              <CardHeader className='p-6 border-b'>
                <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <h2 className='text-2xl font-bold'>Mi historial de pagos</h2>
                    <p className='text-sm text-muted-foreground'>
                      Consultá tus pagos mensuales, pagos adelantados y pagos realizados con Stripe o por administrador.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/mi-cuenta/pagar-cuota')}
                    className='bg-[#02a8e1] hover:bg-[#0288b1] text-white'
                  >
                    <CreditCard className='w-4 h-4 mr-2' />
                    Pagar cuota
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-6 space-y-6'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  <div className='p-4 border rounded-lg'>
                    <p className='text-xs uppercase text-muted-foreground'>Socio</p>
                    <p className='mt-1 font-semibold'>{user?.nombre ?? user?.email ?? '-'}</p>
                  </div>
                  <div className='p-4 border rounded-lg'>
                    <p className='text-xs uppercase text-muted-foreground'>Pagos registrados</p>
                    <p className='mt-1 text-2xl font-bold'>{pagos.length}</p>
                  </div>
                  <div className='p-4 border rounded-lg'>
                    <p className='text-xs uppercase text-muted-foreground'>Total histórico</p>
                    <p className='mt-1 text-2xl font-bold'>{formatMoney(totalPagado)}</p>
                  </div>
                </div>

                {loading ? (
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Cargando historial...
                  </div>
                ) : pagos.length === 0 ? (
                  <div className='p-6 text-center border rounded-lg text-muted-foreground'>
                    Todavía no tenés pagos registrados.
                  </div>
                ) : (
                  <div className='overflow-x-auto border rounded-lg'>
                    <table className='w-full text-sm'>
                      <thead className='bg-muted/40'>
                        <tr>
                          <th className='px-4 py-3 text-left'>Fecha pago</th>
                          <th className='px-4 py-3 text-left'>Cuota</th>
                          <th className='px-4 py-3 text-left'>Período cubierto</th>
                          <th className='px-4 py-3 text-left'>Meses</th>
                          <th className='px-4 py-3 text-left'>Método</th>
                          <th className='px-4 py-3 text-left'>Estado</th>
                          <th className='px-4 py-3 text-right'>Monto</th>
                          <th className='px-4 py-3 text-right'>Recibo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagos.map((pago) => (
                          <tr key={pago.id} className='border-t'>
                            <td className='px-4 py-3 whitespace-nowrap'>{formatDate(pago.fecha_pago)}</td>
                            <td className='px-4 py-3'>
                              <div className='font-medium'>{pago.cuota?.descripcion ?? 'Cuota'}</div>
                              <div className='text-xs text-muted-foreground'>{pago.cuota?.periodo ?? '-'}</div>
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap'>
                              <div className='flex items-center gap-1'>
                                <Clock className='w-3 h-3 text-muted-foreground' />
                                {formatDate(pago.periodo_desde)} → {formatDate(pago.periodo_hasta)}
                              </div>
                            </td>
                            <td className='px-4 py-3'>{pago.meses_cubiertos ?? '-'}</td>
                            <td className='px-4 py-3'>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold border rounded-full ${badgeClass(pago.metodo_pago)}`}>
                                {label(pago.metodo_pago)}
                              </span>
                            </td>
                            <td className='px-4 py-3'>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold border rounded-full ${badgeClass(pago.estado)}`}>
                                {label(pago.estado)}
                              </span>
                            </td>
                            <td className='px-4 py-3 font-semibold text-right whitespace-nowrap'>
                              {formatMoney(pago.monto_pagado)}
                            </td>
                            <td className='px-4 py-3 text-right'>
                              <Button
                                type='button'
                                size='sm'
                                variant='outline'
                                className='border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]'
                                onClick={() => handleDownloadReceipt(pago)}
                                title='Descargar recibo PDF'
                              >
                                <ReceiptText className='w-4 h-4 mr-2' />
                                Recibo
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
