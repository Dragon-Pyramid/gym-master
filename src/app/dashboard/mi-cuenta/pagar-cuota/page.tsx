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
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';

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

function payFeeTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  try {
    return formatFrontendDate(value);
  } catch {
    return value;
  }
}

function formatMoney(value?: number | null, locale: GymMasterLocale = 'es') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function estadoLabel(locale: GymMasterLocale, estado?: string | null) {
  if (estado === 'al_dia') return payFeeTx(locale, 'Al día', 'Up to date');
  if (estado === 'vencido') return payFeeTx(locale, 'Vencido', 'Overdue');
  if (estado === 'sin_pagos') return payFeeTx(locale, 'Sin pagos', 'No payments');
  return estado ?? '-';
}

function translateStripeMessage(locale: GymMasterLocale, value?: string | null) {
  if (!value || locale !== 'en') return value;

  const normalized = value.trim().toLowerCase();
  if (normalized.includes('no tiene stripe activo') || normalized.includes('pagos online habilitados')) {
    return 'This gym does not have online payments enabled. Please contact administration to pay manually.';
  }
  if (normalized.includes('no se pudo verificar')) {
    return 'Could not verify whether this gym has online payments enabled.';
  }
  if (normalized.includes('gimnasio no tiene pagos online')) {
    return 'This gym does not have online payments enabled.';
  }
  return value;
}

function translatePreviewMessage(locale: GymMasterLocale, value?: string | null) {
  if (!value || locale !== 'en') return value;

  const normalized = value.trim();
  const discountMatch = normalized.match(/Pagando\s+(\d+)\s+o más cuotas? por adelantado obten[eé]s\s+(\d+)%\s+de descuento\.?/i);
  if (discountMatch) {
    return `Paying ${discountMatch[1]} or more fees in advance gives you ${discountMatch[2]}% discount.`;
  }
  if (/descuento/i.test(normalized) && /pago adelantado/i.test(normalized)) {
    return normalized
      .replace(/Pagando/i, 'Paying')
      .replace(/o más cuotas? por adelantado/i, 'or more fees in advance')
      .replace(/obten[eé]s/i, 'gives you')
      .replace(/de descuento/i, 'discount');
  }
  return normalized;
}

function coverageDetail(locale: GymMasterLocale, meses: number) {
  if (locale === 'en') {
    return `${meses} ${meses === 1 ? 'month' : 'months'} of coverage`;
  }
  return `${meses} ${meses === 1 ? 'mes' : 'meses'} de cobertura`;
}

function monthOption(locale: GymMasterLocale, meses: number) {
  if (locale === 'en') {
    return `${meses} ${meses === 1 ? 'month' : 'months'}`;
  }
  return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
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
  const { locale } = useI18n();
  const c = (es: string, en: string) => payFeeTx(locale, es, en);
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
      setStripeMensaje(error.message || c('No se pudo verificar si el gimnasio tiene pagos online habilitados.', 'Could not verify whether this gym has online payments enabled.'));
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
      if (!res.ok) throw new Error(json.error || c('No se pudo obtener el estado de cuota', 'Could not load fee status'));
      setEstado(json.data);
    } catch (error: any) {
      toast.error(error.message || c('Error al obtener el estado de cuota', 'Error loading fee status'));
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
      if (!res.ok) throw new Error(json.error || c('No se pudo calcular el pago', 'Could not calculate payment'));
      setPreview(json.data ?? null);
    } catch (error: any) {
      setPreview(null);
      setStripeDisponible(false);
      setStripeMensaje(error.message || c('El gimnasio no tiene pagos online habilitados.', 'This gym does not have online payments enabled.'));
      toast.error(error.message || c('Error al calcular el pago', 'Error calculating payment'));
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

  const detallePago = useMemo(() => coverageDetail(locale, meses), [locale, meses]);

  const estadoEsAlDia = estado?.estado_cuota === 'al_dia';
  const statusDescription = loading
    ? c('Estamos consultando el estado de tu cuota.', 'Checking your fee status.')
    : estadoEsAlDia
      ? c('Tu cobertura figura al día. Podés pagar meses adicionales si el gimnasio lo permite.', 'Your coverage is up to date. You can pay additional months if the gym allows it.')
      : c('Regularizá tu cuota para mantener el acceso y conservar el historial actualizado.', 'Settle your fee to keep access and keep your history updated.');

  const handlePagar = async () => {
    if (stripeDisponible !== true) {
      toast.error(translateStripeMessage(locale, stripeMensaje) || c('El gimnasio no tiene pagos online habilitados.', 'This gym does not have online payments enabled.'));
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
      if (!res.ok) throw new Error(json.error || c('No se pudo iniciar el pago', 'Could not start payment'));
      if (!json.url) throw new Error(c('Stripe no devolvió una URL de pago', 'Stripe did not return a payment URL'));
      window.location.href = json.url;
    } catch (error: any) {
      toast.error(error.message || c('Error al iniciar el pago con Stripe', 'Error starting Stripe payment'));
      setPaying(false);
    }
  };

  if (!isInitialized) {
    return <div className='flex min-h-screen items-center justify-center'>{c('Cargando...', 'Loading...')}</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background text-foreground'>
        <AppSidebar />
        <SidebarInset className='!grid !h-[100dvh] !min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title={c('Pagar cuota', 'Pay fee')} />
          <section className='min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:pb-8'>
            <div className='mx-auto flex w-full max-w-5xl flex-col gap-5'>
              <section className='overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm dark:border-sky-900/60 dark:from-slate-950 dark:via-sky-950/20 dark:to-emerald-950/20 sm:p-6'>
                <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300'>
                      {c('Cuenta del socio', 'Member account')}
                    </p>
                    <h1 className='mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl'>
                      {c('Pagar cuota', 'Pay fee')}
                    </h1>
                    <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300'>
                      {c('Revisá tu estado, elegí los meses de cobertura y aboná online si Stripe está habilitado.', 'Check your status, choose the coverage months, and pay online if Stripe is enabled.')}
                    </p>
                  </div>
                  <div className='rounded-3xl border border-white/70 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                    <div className='flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100'>
                      <ShieldCheck className='h-4 w-4 text-emerald-600 dark:text-emerald-300' />
                      {stripeDisponible === true
                        ? c('Pago seguro vía Stripe', 'Secure payment via Stripe')
                        : stripeDisponible === false
                          ? c('Pagos online no disponibles', 'Online payments unavailable')
                          : c('Verificando pagos online', 'Checking online payments')}
                    </div>
                    <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                      {c('El pago aprobado actualiza tu cuenta desde el webhook configurado.', 'Approved payments update your account through the configured webhook.')}
                    </p>
                  </div>
                </div>
              </section>

              {!puedePagar ? (
                <div className='rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100'>
                  {c('Este flujo está disponible para usuarios con rol socio.', 'This flow is available for users with the member role.')}
                </div>
              ) : null}

              <section className={`rounded-[2rem] border p-5 shadow-sm ${estadoEsAlDia ? 'border-emerald-100 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-50' : 'border-amber-100 bg-amber-50/80 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-50'}`}>
                {loading ? (
                  <div className='flex items-center gap-2 text-sm font-semibold opacity-80'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {c('Consultando estado de cuota...', 'Checking fee status...')}
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
                            {estadoLabel(locale, estado?.estado_cuota)}
                          </span>
                          <span className='inline-flex items-center gap-1 rounded-full border border-current/20 px-3 py-1'>
                            <CalendarClock className='h-3.5 w-3.5' />
                            {c('Hasta', 'Until')} {formatDate(estado?.periodo_hasta)}
                          </span>
                          {estado?.estado_cuota === 'vencido' ? (
                            <span className='inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'>
                              {locale === 'en'
                                ? `${estado.dias_vencido} ${estado.dias_vencido === 1 ? 'day' : 'days'} overdue`
                                : `${estado.dias_vencido} día(s) vencido`}
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
                      {c('Ver historial', 'View history')}
                    </Button>
                  </div>
                )}
              </section>

              {stripeDisponible === false ? (
                <div className='flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100'>
                  <AlertTriangle className='mt-0.5 h-4 w-4 flex-none' />
                  <div>
                    <p className='font-black'>{c('Pagos online no habilitados', 'Online payments not enabled')}</p>
                    <p className='mt-1 leading-5'>
                      {translateStripeMessage(locale, stripeMensaje) || c('Este gimnasio no tiene Stripe activo. Comunicate con administración para abonar por medios manuales.', 'This gym does not have Stripe enabled. Please contact administration to pay manually.')}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className='grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.15fr]'>
                <Card className='rounded-[2rem] border-border/70 shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                  <CardContent className='p-5 sm:p-6'>
                    <div className='mb-5 flex items-start gap-3'>
                      <div className='rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200'>
                        <WalletCards className='h-5 w-5' />
                      </div>
                      <div>
                        <h2 className='text-lg font-black'>{c('Elegí la cobertura', 'Choose coverage')}</h2>
                        <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                          {c('Seleccioná la cantidad de meses a pagar. El sistema calcula el período desde tu último vencimiento.', 'Select the number of months to pay. The system calculates the period from your last due date.')}
                        </p>
                      </div>
                    </div>

                    <label className='block text-sm font-bold'>{c('Meses a pagar', 'Months to pay')}</label>
                    <select
                      value={meses}
                      onChange={(event) => setMeses(Number(event.target.value))}
                      className='mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-950'
                    >
                      {[1, 2, 3, 6, 12].map((monthCount) => (
                        <option key={monthCount} value={monthCount}>{monthOption(locale, monthCount)}</option>
                      ))}
                    </select>
                    <p className='mt-3 text-xs leading-5 text-muted-foreground'>
                      {c('Si existe un descuento por pago adelantado, se mostrará automáticamente antes de iniciar Stripe.', 'If an advance-payment discount exists, it will be shown automatically before starting Stripe.')}
                    </p>
                  </CardContent>
                </Card>

                <Card className='rounded-[2rem] border-border/70 shadow-sm dark:border-slate-800 dark:bg-slate-950/70'>
                  <CardContent className='p-5 sm:p-6'>
                    <div className='mb-5 flex items-start justify-between gap-3'>
                      <div>
                        <h2 className='text-lg font-black'>{c('Resumen del pago', 'Payment summary')}</h2>
                        <p className='mt-1 text-sm text-muted-foreground'>{detallePago}</p>
                      </div>
                      <CreditCard className='h-5 w-5 text-sky-600 dark:text-sky-300' />
                    </div>

                    {loadingPreview ? (
                      <div className='flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        {c('Calculando total...', 'Calculating total...')}
                      </div>
                    ) : preview ? (
                      <div className='space-y-3 text-sm'>
                        <div className='flex justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3'>
                          <span className='text-muted-foreground'>{c('Subtotal', 'Subtotal')}</span>
                          <span className='font-bold'>{formatMoney(preview.subtotal, locale)}</span>
                        </div>
                        {preview.config?.activo && Number(preview.config?.porcentaje ?? 0) > 0 ? (
                          <div className='flex justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100'>
                            <span>{c('Descuento', 'Discount')}</span>
                            <span className='font-bold'>-{formatMoney(preview.descuento_monto, locale)}</span>
                          </div>
                        ) : null}
                        <div className='flex items-center justify-between gap-3 rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-50'>
                          <span className='font-black'>{c('Total a pagar', 'Total to pay')}</span>
                          <span className='text-2xl font-black'>{formatMoney(preview.total, locale)}</span>
                        </div>
                        {preview.mensaje ? (
                          <p className={`rounded-2xl border p-3 text-xs leading-5 ${
                            preview.descuento_aplicado
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                              : 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-200'
                          }`}>
                            {translatePreviewMessage(locale, preview.mensaje)}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className='rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground'>
                        {stripeDisponible === false
                          ? c('No se puede calcular el total porque los pagos online no están habilitados.', 'The total cannot be calculated because online payments are not enabled.')
                          : c('El total se mostrará cuando Stripe esté disponible.', 'The total will be shown when Stripe is available.')}
                      </div>
                    )}

                    <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end'>
                      <Button
                        variant='outline'
                        onClick={() => router.push('/dashboard/mi-cuenta/historial-pagos')}
                        className='h-11 rounded-2xl'
                      >
                        <History className='mr-2 h-4 w-4' />
                        {c('Historial', 'History')}
                      </Button>
                      <Button
                        disabled={!puedePagar || paying || loadingPreview || stripeDisponible !== true}
                        onClick={handlePagar}
                        className='h-11 rounded-2xl bg-[#02a8e1] text-white hover:bg-[#0288b1]'
                      >
                        {paying ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CreditCard className='mr-2 h-4 w-4' />}
                        {paying ? c('Redirigiendo...', 'Redirecting...') : c('Pagar con Stripe', 'Pay with Stripe')}
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
