'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  History,
  Loader2,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getToken } from '@/services/storageService';
import type { PagoDescuentoPreview } from '@/interfaces/pago.interface';
import { useAuthStore } from '@/stores/authStore';
import { formatFrontendDate } from '@/utils/dateFormat';
import { getGimnasioStripeStatus } from '@/services/gimnasioParametrizacionService';

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
  try {
    return formatFrontendDate(value);
  } catch {
    return value;
  }
}

function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function estadoLabel(estado?: string | null) {
  if (estado === 'al_dia') return 'Al día';
  if (estado === 'vencido') return 'Vencido';
  if (estado === 'sin_pagos') return 'Sin pagos';
  return estado ?? '-';
}

function estadoClass(estado?: string | null) {
  if (estado === 'al_dia') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200';
  }
  if (estado === 'vencido') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200';
  }
  if (estado === 'sin_pagos') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200';
  }
  return 'border-border bg-muted text-muted-foreground';
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
  const [stripeDisponible, setStripeDisponible] = useState<boolean | null>(null);
  const [stripeMensaje, setStripeMensaje] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const puedePagar = user?.rol === 'socio';

  const loadStripeStatus = async () => {
    try {
      const status = await getGimnasioStripeStatus();
      setStripeDisponible(status.pagos_online_disponibles);
      setStripeMensaje(status.mensaje);
    } catch (error: any) {
      setStripeDisponible(false);
      setStripeMensaje(error.message || 'No se pudo verificar si el gimnasio tiene pagos online habilitados.');
    }
  };

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
      setStripeDisponible(false);
      setStripeMensaje(error.message || 'El gimnasio no tiene pagos online habilitados.');
      toast.error(error.message || 'Error al calcular el pago');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadEstado();
      loadStripeStatus();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.rol === 'socio' && stripeDisponible === true) {
      loadPreview(meses);
    }
    if (stripeDisponible === false) {
      setPreview(null);
    }
  }, [isInitialized, isAuthenticated, user?.rol, meses, stripeDisponible]);

  const detallePago = useMemo(() => {
    const suffix = meses === 1 ? 'mes' : 'meses';
    return `${meses} ${suffix} de cobertura`;
  }, [meses]);

  const estadoEsAlDia = estado?.estado_cuota === 'al_dia';
  const statusDescription = loading
    ? 'Estamos consultando el estado de tu cuota.'
    : estadoEsAlDia
      ? 'Tu cobertura figura al día. Podés pagar meses adicionales si el gimnasio lo permite.'
      : 'Regularizá tu cuota para mantener el acceso y conservar el historial actualizado.';

  const handlePagar = async () => {
    if (stripeDisponible !== true) {
      toast.error(stripeMensaje || 'El gimnasio no tiene pagos online habilitados.');
      return;
    }

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
    return <div className='flex min-h-screen items-center justify-center'>Cargando...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background text-foreground'>
        <AppSidebar />
        <SidebarInset className='!grid !h-[100dvh] !min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title='Pagar cuota' />
          <section className='min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:pb-8'>
            <div className='mx-auto flex w-full max-w-5xl flex-col gap-5'>
              <section className='overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm dark:border-sky-900/60 dark:from-slate-950 dark:via-sky-950/20 dark:to-emerald-950/20 sm:p-6'>
                <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300'>
                      Cuenta del socio
                    </p>
                    <h1 className='mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl'>
                      Pagar cuota
                    </h1>
                    <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300'>
                      Revisá tu estado, elegí los meses de cobertura y aboná online si Stripe está habilitado.
                    </p>
                  </div>
                  <div className='rounded-3xl border border-white/70 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                    <div className='flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100'>
                      <ShieldCheck className='h-4 w-4 text-emerald-600 dark:text-emerald-300' />
                      {stripeDisponible === true
                        ? 'Pago seguro vía Stripe'
                        : stripeDisponible === false
                          ? 'Pagos online no disponibles'
                          : 'Verificando pagos online'}
                    </div>
                    <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                      El pago aprobado actualiza tu cuenta desde el webhook configurado.
                    </p>
                  </div>
                </div>
              </section>

              {!puedePagar ? (
                <div className='rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100'>
                  Este flujo está disponible para usuarios con rol socio.
                </div>
              ) : null}

              <section className={`rounded-[2rem] border p-5 shadow-sm ${estadoEsAlDia ? 'border-emerald-100 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-50' : 'border-amber-100 bg-amber-50/80 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-50'}`}>
                {loading ? (
                  <div className='flex items-center gap-2 text-sm font-semibold opacity-80'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Consultando estado de cuota...
                  </div>
                ) : (
                  <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='flex items-start gap-3'>
                      <div className={`rounded-2xl p-3 ${estadoEsAlDia ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'}`}>
                        {estadoEsAlDia ? <CheckCircle2 className='h-5 w-5' /> : <AlertTriangle className='h-5 w-5' />}
                      </div>
                      <div className='min-w-0'>
                        <p className='text-sm font-black'>{estado?.nombre_completo ?? user?.nombre ?? '-'}</p>
                        <p className='mt-1 text-xs leading-5 opacity-80'>{statusDescription}</p>
                        <div className='mt-3 flex flex-wrap items-center gap-2 text-xs font-bold'>
                          <span className={`inline-flex rounded-full border px-3 py-1 ${estadoClass(estado?.estado_cuota)}`}>
                            {estadoLabel(estado?.estado_cuota)}
                          </span>
                          <span className='inline-flex items-center gap-1 rounded-full border border-current/20 px-3 py-1'>
                            <CalendarClock className='h-3.5 w-3.5' />
                            Hasta {formatDate(estado?.periodo_hasta)}
                          </span>
                          {estado?.estado_cuota === 'vencido' ? (
                            <span className='inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'>
                              {estado.dias_vencido} día(s) vencido
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/dashboard/mi-cuenta/historial-pagos')}
                      className='h-11 rounded-2xl bg-white/80 dark:bg-slate-950/70'
                    >
                      <History className='mr-2 h-4 w-4' />
                      Ver historial
                    </Button>
                  </div>
                )}
              </section>

              {stripeDisponible === false ? (
                <div className='flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100'>
                  <AlertTriangle className='mt-0.5 h-4 w-4 flex-none' />
                  <div>
                    <p className='font-black'>Pagos online no habilitados</p>
                    <p className='mt-1 leading-5'>
                      {stripeMensaje || 'Este gimnasio no tiene Stripe activo. Comunicate con administración para abonar por medios manuales.'}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className='grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.15fr]'>
                <Card className='rounded-[2rem] border-border/70 shadow-sm'>
                  <CardContent className='p-5 sm:p-6'>
                    <div className='mb-5 flex items-start gap-3'>
                      <div className='rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200'>
                        <WalletCards className='h-5 w-5' />
                      </div>
                      <div>
                        <h2 className='text-lg font-black'>Elegí la cobertura</h2>
                        <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                          Seleccioná la cantidad de meses a pagar. El sistema calcula el período desde tu último vencimiento.
                        </p>
                      </div>
                    </div>

                    <label className='block text-sm font-bold'>Meses a pagar</label>
                    <select
                      value={meses}
                      onChange={(event) => setMeses(Number(event.target.value))}
                      className='mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-950'
                    >
                      <option value={1}>1 mes</option>
                      <option value={2}>2 meses</option>
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                    <p className='mt-3 text-xs leading-5 text-muted-foreground'>
                      Si existe un descuento por pago adelantado, se mostrará automáticamente antes de iniciar Stripe.
                    </p>
                  </CardContent>
                </Card>

                <Card className='rounded-[2rem] border-border/70 shadow-sm'>
                  <CardContent className='p-5 sm:p-6'>
                    <div className='mb-5 flex items-start justify-between gap-3'>
                      <div>
                        <h2 className='text-lg font-black'>Resumen del pago</h2>
                        <p className='mt-1 text-sm text-muted-foreground'>{detallePago}</p>
                      </div>
                      <CreditCard className='h-5 w-5 text-sky-600 dark:text-sky-300' />
                    </div>

                    {loadingPreview ? (
                      <div className='flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        Calculando total...
                      </div>
                    ) : preview ? (
                      <div className='space-y-3 text-sm'>
                        <div className='flex justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3'>
                          <span className='text-muted-foreground'>Subtotal</span>
                          <span className='font-bold'>{formatMoney(preview.subtotal)}</span>
                        </div>
                        {preview.config?.activo && Number(preview.config?.porcentaje ?? 0) > 0 ? (
                          <div className='flex justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100'>
                            <span>Descuento</span>
                            <span className='font-bold'>-{formatMoney(preview.descuento_monto)}</span>
                          </div>
                        ) : null}
                        <div className='flex items-center justify-between gap-3 rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-50'>
                          <span className='font-black'>Total a pagar</span>
                          <span className='text-2xl font-black'>{formatMoney(preview.total)}</span>
                        </div>
                        {preview.mensaje ? (
                          <p className={`rounded-2xl border p-3 text-xs leading-5 ${
                            preview.descuento_aplicado
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                              : 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-200'
                          }`}>
                            {preview.mensaje}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className='rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground'>
                        {stripeDisponible === false
                          ? 'No se puede calcular el total porque los pagos online no están habilitados.'
                          : 'El total se mostrará cuando Stripe esté disponible.'}
                      </div>
                    )}

                    <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end'>
                      <Button
                        variant='outline'
                        onClick={() => router.push('/dashboard/mi-cuenta/historial-pagos')}
                        className='h-11 rounded-2xl'
                      >
                        <History className='mr-2 h-4 w-4' />
                        Historial
                      </Button>
                      <Button
                        disabled={!puedePagar || paying || loadingPreview || stripeDisponible !== true}
                        onClick={handlePagar}
                        className='h-11 rounded-2xl bg-[#02a8e1] text-white hover:bg-[#0288b1]'
                      >
                        {paying ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CreditCard className='mr-2 h-4 w-4' />}
                        Pagar con Stripe
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
