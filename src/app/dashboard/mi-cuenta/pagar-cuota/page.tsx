'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getToken } from '@/services/storageService';
import type { PagoDescuentoPreview } from '@/interfaces/pago.interface';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDate } from '@/utils/dateFormat';

type EstadoCuota = {
  id_socio: string;
  nombre_completo: string;
  activo: boolean;
  ultimo_pago: string | null;
  ultimo_vencimiento: string | null;
  periodo_hasta: string | null;
  estado_cuota: 'al_dia' | 'vencido' | 'sin_pagos' | string;
  dias_vencido: number;
  metodo_pago: string | null;
  meses_cubiertos: number | null;
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return formatFrontendDate(value);
}

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function estadoLabel(estado?: string | null) {
  if (estado === 'al_dia') return 'Al día';
  if (estado === 'vencido') return 'Vencido';
  if (estado === 'sin_pagos') return 'Sin pagos';
  return estado ?? '-';
}

function estadoClass(estado?: string | null) {
  if (estado === 'al_dia') return 'bg-green-100 text-green-700 border-green-200';
  if (estado === 'vencido') return 'bg-red-100 text-red-700 border-red-200';
  if (estado === 'sin_pagos') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-muted text-muted-foreground border-border';
}

export default function PagarCuotaSocioPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const [estado, setEstado] = useState<EstadoCuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [meses, setMeses] = useState(1);
  const [preview, setPreview] = useState<PagoDescuentoPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const puedePagar = user?.rol === 'socio';

  const loadEstado = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch('/api/cuota-estado', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo obtener el estado de cuota');
      setEstado(json.data);
    } catch (error: any) {
      toast.error(error.message || 'Error al obtener el estado de cuota');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (mesesSeleccionados: number) => {
    try {
      setLoadingPreview(true);
      const token = getToken();
      const res = await fetch(`/api/pagar-cuota?meses_cubiertos=${mesesSeleccionados}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo calcular el pago');
      setPreview(json.data ?? null);
    } catch (error: any) {
      setPreview(null);
      toast.error(error.message || 'Error al calcular el pago');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadEstado();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.rol === 'socio') {
      loadPreview(meses);
    }
  }, [isInitialized, isAuthenticated, user?.rol, meses]);

  const detallePago = useMemo(() => {
    const suffix = meses === 1 ? 'mes' : 'meses';
    return `${meses} ${suffix} de cobertura`;
  }, [meses]);

  const handlePagar = async () => {
    try {
      setPaying(true);
      const token = getToken();
      const res = await fetch('/api/pagar-cuota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ meses_cubiertos: meses }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo iniciar el pago');
      if (!json.url) throw new Error('Stripe no devolvió una URL de pago');
      window.location.href = json.url;
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar el pago con Stripe');
      setPaying(false);
    }
  };

  if (!isInitialized) {
    return <div className='flex items-center justify-center min-h-screen'>Cargando...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen bg-background text-foreground'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Pagar cuota' />
          <main className='flex-1 p-6 space-y-6'>
            <Card className='w-full max-w-4xl mx-auto'>
              <CardHeader className='p-6 border-b'>
                <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <h2 className='text-2xl font-bold'>Mi cuenta</h2>
                    <p className='text-sm text-muted-foreground'>
                      Pagá tu cuota online con Stripe. Los pagos en efectivo los registra el administrador.
                    </p>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <ShieldCheck className='w-4 h-4' />
                    Pago seguro vía Stripe
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-6 space-y-6'>
                {!puedePagar && (
                  <div className='p-4 text-sm border rounded-md bg-yellow-50 text-yellow-700 border-yellow-200'>
                    Este flujo está disponible para usuarios con rol socio.
                  </div>
                )}

                {loading ? (
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Consultando estado de cuota...
                  </div>
                ) : (
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div className='p-4 border rounded-lg'>
                      <p className='text-xs uppercase text-muted-foreground'>Socio</p>
                      <p className='mt-1 font-semibold'>{estado?.nombre_completo ?? user?.nombre ?? '-'}</p>
                    </div>
                    <div className='p-4 border rounded-lg'>
                      <p className='text-xs uppercase text-muted-foreground'>Estado de cuota</p>
                      <span className={`inline-flex px-3 py-1 mt-2 text-xs font-semibold border rounded-full ${estadoClass(estado?.estado_cuota)}`}>
                        {estadoLabel(estado?.estado_cuota)}
                      </span>
                    </div>
                    <div className='p-4 border rounded-lg'>
                      <p className='text-xs uppercase text-muted-foreground'>Cobertura vigente hasta</p>
                      <p className='mt-1 font-semibold'>{formatDate(estado?.periodo_hasta)}</p>
                      {estado?.estado_cuota === 'vencido' && (
                        <p className='mt-1 text-xs text-red-600'>{estado.dias_vencido} día(s) vencido</p>
                      )}
                    </div>
                  </div>
                )}

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='p-4 border rounded-lg'>
                    <label className='block mb-2 text-sm font-medium'>Meses a pagar</label>
                    <select
                      value={meses}
                      onChange={(event) => setMeses(Number(event.target.value))}
                      className='w-full h-10 px-3 text-sm border rounded-md bg-background'
                    >
                      <option value={1}>1 mes</option>
                      <option value={2}>2 meses</option>
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                    <p className='mt-2 text-xs text-muted-foreground'>
                      El sistema calculará automáticamente el período cubierto según tu último pago registrado.
                    </p>
                  </div>

                  <div className='p-4 border rounded-lg'>
                    <p className='text-sm font-medium'>Detalle</p>
                    <p className='mt-2 text-sm text-muted-foreground'>{detallePago}</p>
                    {loadingPreview ? (
                      <p className='mt-2 text-xs text-muted-foreground'>Calculando total...</p>
                    ) : preview ? (
                      <div className='mt-3 space-y-1 text-sm'>
                        <div className='flex justify-between gap-3'>
                          <span className='text-muted-foreground'>Subtotal</span>
                          <span className='font-medium'>{formatMoney(preview.subtotal)}</span>
                        </div>
                        {preview.config?.activo && Number(preview.config?.porcentaje ?? 0) > 0 ? (
                          <div className='flex justify-between gap-3'>
                            <span className='text-muted-foreground'>Descuento</span>
                            <span className='font-medium text-emerald-700'>
                              -{formatMoney(preview.descuento_monto)}
                            </span>
                          </div>
                        ) : null}
                        <div className='flex justify-between gap-3 border-t pt-2'>
                          <span className='font-semibold'>Total a pagar</span>
                          <span className='font-bold'>{formatMoney(preview.total)}</span>
                        </div>
                        {preview.mensaje ? (
                          <p className={`rounded-md border p-2 text-xs ${
                            preview.descuento_aplicado
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                          }`}>
                            {preview.mensaje}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <p className='mt-3 text-xs text-muted-foreground'>
                      Al finalizar el checkout, Stripe notificará el pago al webhook y se actualizará tu estado de cuota.
                    </p>
                  </div>
                </div>

                <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-end'>
                  <Button variant='outline' onClick={() => router.push('/dashboard/mi-cuenta/historial-pagos')}>
                    Ver historial de pagos
                  </Button>
                  <Button
                    disabled={!puedePagar || paying || loadingPreview}
                    onClick={handlePagar}
                    className='bg-[#02a8e1] hover:bg-[#0288b1] text-white'
                  >
                    {paying ? <Loader2 className='w-4 h-4 mr-2 animate-spin' /> : <CreditCard className='w-4 h-4 mr-2' />}
                    Pagar con Stripe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
