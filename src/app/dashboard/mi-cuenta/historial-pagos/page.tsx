'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatFrontendDate } from '@/utils/dateFormat';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Clock,
  CreditCard,
  Download,
  FileText,
  History,
  Loader2,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
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
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';

type PagoSocio = {
  id: string;
  fecha_pago: string;
  fecha_vencimiento: string | null;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  meses_cubiertos: number | null;
  monto_pagado: number;
  subtotal?: number | null;
  descuento_porcentaje?: number | null;
  descuento_monto?: number | null;
  descuento_motivo?: string | null;
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

function paymentHistoryTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function formatMoney(value?: number | null, locale: GymMasterLocale = 'es') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  try {
    return formatFrontendDate(value);
  } catch {
    return value;
  }
}

function label(locale: GymMasterLocale, value?: string | null) {
  if (!value) return '-';
  if (value === 'stripe') return 'Stripe';
  if (value === 'efectivo') return paymentHistoryTx(locale, 'Efectivo', 'Cash');
  if (value === 'transferencia') return paymentHistoryTx(locale, 'Transferencia', 'Bank transfer');
  if (value === 'pagado') return paymentHistoryTx(locale, 'Pagado', 'Paid');
  if (value === 'pendiente') return paymentHistoryTx(locale, 'Pendiente', 'Pending');
  if (value === 'cancelado') return paymentHistoryTx(locale, 'Cancelado', 'Cancelled');
  return value.replace(/_/g, ' ');
}

function translateFeeDescription(locale: GymMasterLocale, value?: string | null) {
  if (!value) return paymentHistoryTx(locale, 'Cuota', 'Fee');
  if (locale !== 'en') return value;

  return value
    .replace(/Cuota mensual/gi, 'Monthly fee')
    .replace(/Cuota/gi, 'Fee')
    .replace(/Membresía/gi, 'Membership')
    .replace(/pagos/gi, 'payments')
    .replace(/pago/gi, 'payment');
}

function confirmedCount(locale: GymMasterLocale, count: number) {
  if (locale === 'en') return `${count} confirmed`;
  return `${count} confirmado${count === 1 ? '' : 's'}`;
}

function badgeClass(value?: string | null) {
  if (value === 'pagado') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200';
  }
  if (value === 'stripe') {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-200';
  }
  if (value === 'efectivo' || value === 'transferencia') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200';
  }
  if (value === 'cancelado') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200';
  }
  return 'border-border bg-muted text-muted-foreground';
}

function sortPayments(payments: PagoSocio[]) {
  return [...payments].sort((a, b) => {
    const dateA = new Date(a.fecha_pago ?? '').getTime();
    const dateB = new Date(b.fecha_pago ?? '').getTime();
    return dateB - dateA;
  });
}

function toReceiptPayload(pago: PagoSocio): ResponsePago {
  return {
    ...pago,
    enviar_email: pago.enviar_email ?? false,
    socio: pago.socio ?? {
      id_socio: '',
      nombre_completo: 'Socio',
      email: null,
    },
    cuota: pago.cuota ?? {
      id: '',
      descripcion: 'Cuota',
      monto: pago.monto_pagado,
      periodo: null,
    },
    registrado_por: pago.registrado_por ?? null,
  } as ResponsePago;
}

export default function HistorialPagosSocioPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const t = (es: string, en: string) => paymentHistoryTx(locale, es, en);
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
      if (!res.ok) throw new Error(json.error || t('No se pudo obtener el historial de pagos', 'Could not load payment history'));
      setPagos(Array.isArray(json.data) ? json.data : []);
    } catch (error: any) {
      toast.error(error.message || t('Error al obtener el historial de pagos', 'Error loading payment history'));
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
      await descargarPagoReciboPdf(toReceiptPayload(pago));
      toast.success(t('Recibo PDF generado correctamente', 'PDF receipt generated successfully'));
    } catch (error: any) {
      toast.error(error.message || t('No se pudo generar el recibo PDF', 'Could not generate the PDF receipt'));
    }
  };

  const pagosOrdenados = useMemo(() => sortPayments(pagos), [pagos]);
  const ultimoPago = pagosOrdenados[0];
  const totalPagado = useMemo(
    () => pagos.reduce((acc, pago) => acc + Number(pago.monto_pagado ?? 0), 0),
    [pagos]
  );
  const pagosConfirmados = useMemo(
    () => pagos.filter((pago) => pago.estado === 'pagado').length,
    [pagos]
  );

  if (!isInitialized) {
    return <div className='flex min-h-screen items-center justify-center'>{t('Cargando...', 'Loading...')}</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background text-foreground'>
        <AppSidebar />
        <SidebarInset className='!grid !h-[100dvh] !min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
          <AppHeader title={t('Historial de pagos', 'Payment history')} />
          <section className='min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:pb-8'>
            <div className='mx-auto flex w-full max-w-6xl flex-col gap-5'>
              <section className='overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm dark:border-emerald-900/60 dark:from-slate-950 dark:via-emerald-950/20 dark:to-sky-950/20 sm:p-6'>
                <div className='flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300'>{t('Pagos y recibos', 'Payments and receipts')}</p>
                    <h1 className='mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl'>{t('Mi historial de pagos', 'My payment history')}</h1>
                    <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300'>{t('Consultá tus cuotas abonadas, períodos cubiertos y descargá recibos PDF desde el celular.', 'Check your paid fees, covered periods, and download PDF receipts from your phone.')}</p>
                  </div>
                  <div className='flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row'>
                    <Button
                      variant='outline'
                      onClick={() => router.push('/dashboard/mi-cuenta/pagar-cuota')}
                      className='h-11 justify-center rounded-2xl border-emerald-200 bg-white/80 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-950/70 dark:text-emerald-200 dark:hover:bg-emerald-950/40'
                    >
                      <CreditCard className='mr-2 h-4 w-4' />{t('Pagar cuota', 'Pay fee')}</Button>
                  </div>
                </div>
              </section>

              <section className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                <div className='rounded-3xl border border-border/70 bg-card p-4 shadow-sm'>
                  <div className='mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground'>
                    <WalletCards className='h-4 w-4' />{t('Socio', 'Member')}</div>
                  <p className='truncate text-base font-black'>{user?.nombre ?? user?.email ?? '-'}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>{t('Cuenta personal', 'Personal account')}</p>
                </div>
                <div className='rounded-3xl border border-border/70 bg-card p-4 shadow-sm'>
                  <div className='mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground'>
                    <History className='h-4 w-4' />{t('Registros', 'Records')}</div>
                  <p className='text-2xl font-black'>{pagos.length}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>{confirmedCount(locale, pagosConfirmados)}</p>
                </div>
                <div className='rounded-3xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20'>
                  <div className='mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300'>
                    <ReceiptText className='h-4 w-4' />{t('Total histórico', 'Historical total')}</div>
                  <p className='text-2xl font-black text-emerald-900 dark:text-emerald-100'>{formatMoney(totalPagado, locale)}</p>
                  <p className='mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80'>{t('Pagos registrados en tu cuenta', 'Payments registered in your account')}</p>
                </div>
              </section>

              {ultimoPago ? (
                <section className='rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sky-950 shadow-sm dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-50 sm:p-5'>
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-start gap-3'>
                      <div className='rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'>
                        <FileText className='h-5 w-5' />
                      </div>
                      <div>
                        <p className='text-sm font-black'>{t('Último comprobante disponible', 'Latest receipt available')}</p>
                        <p className='mt-1 text-xs leading-5 opacity-80'>
                          {translateFeeDescription(locale, ultimoPago.cuota?.descripcion)} · {formatDate(ultimoPago.fecha_pago)} · {formatMoney(ultimoPago.monto_pagado, locale)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => handleDownloadReceipt(ultimoPago)}
                      className='h-11 justify-center rounded-2xl border-sky-200 bg-white/80 text-sky-800 hover:bg-sky-100 dark:border-sky-900 dark:bg-slate-950/70 dark:text-sky-200 dark:hover:bg-sky-950/40'
                    >
                      <Download className='mr-2 h-4 w-4' />{t('Descargar último recibo', 'Download latest receipt')}</Button>
                  </div>
                </section>
              ) : null}

              <Card className='overflow-hidden rounded-[2rem] border-border/70 shadow-sm'>
                <CardHeader className='border-b bg-muted/20 p-4 sm:p-6'>
                  <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <h2 className='text-lg font-black'>{t('Detalle de pagos', 'Payment details')}</h2>
                      <p className='text-sm text-muted-foreground'>{t('Períodos, métodos, estados y recibos descargables.', 'Periods, methods, statuses, and downloadable receipts.')}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='p-4 sm:p-6'>
                  {loading ? (
                    <div className='flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
                      <Loader2 className='h-4 w-4 animate-spin' />{t('Cargando historial...', 'Loading history...')}</div>
                  ) : pagosOrdenados.length === 0 ? (
                    <div className='rounded-3xl border border-dashed border-border p-8 text-center'>
                      <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted'>
                        <ReceiptText className='h-6 w-6 text-muted-foreground' />
                      </div>
                      <p className='font-bold'>{t('Todavía no tenés pagos registrados.', 'You do not have registered payments yet.')}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>{t('Cuando se registre un pago, vas a poder consultar el recibo desde este historial.', 'When a payment is registered, you will be able to view its receipt from this history.')}</p>
                    </div>
                  ) : (
                    <>
                      <div className='grid grid-cols-1 gap-3 md:hidden'>
                        {pagosOrdenados.map((pago) => (
                          <article key={pago.id} className='rounded-3xl border border-border/70 bg-background p-4 shadow-sm'>
                            <div className='flex items-start justify-between gap-3'>
                              <div className='min-w-0'>
                                <p className='text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground'>
                                  {formatDate(pago.fecha_pago)}
                                </p>
                                <h3 className='mt-1 truncate text-base font-black'>{translateFeeDescription(locale, pago.cuota?.descripcion)}</h3>
                                <p className='mt-1 text-xs text-muted-foreground'>{pago.cuota?.periodo ?? t('Período no informado', 'Period not available')}</p>
                              </div>
                              <p className='shrink-0 text-base font-black'>{formatMoney(pago.monto_pagado, locale)}</p>
                            </div>

                            <div className='mt-4 grid grid-cols-2 gap-2 text-xs'>
                              <div className='rounded-2xl border border-border/70 bg-muted/20 p-3'>
                                <p className='font-bold text-muted-foreground'>{t('Período', 'Period')}</p>
                                <p className='mt-1 font-semibold'>{formatDate(pago.periodo_desde)} → {formatDate(pago.periodo_hasta)}</p>
                              </div>
                              <div className='rounded-2xl border border-border/70 bg-muted/20 p-3'>
                                <p className='font-bold text-muted-foreground'>{t('Meses', 'Months')}</p>
                                <p className='mt-1 font-semibold'>{pago.meses_cubiertos ?? '-'}</p>
                              </div>
                            </div>

                            <div className='mt-3 flex flex-wrap gap-2'>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass(pago.metodo_pago)}`}>
                                {label(locale, pago.metodo_pago)}
                              </span>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass(pago.estado)}`}>
                                {label(locale, pago.estado)}
                              </span>
                              {Number(pago.descuento_monto ?? 0) > 0 ? (
                                <span className='inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'>
                                  {t('Desc.', 'Disc.')} {formatMoney(pago.descuento_monto, locale)}
                                </span>
                              ) : null}
                            </div>

                            <Button
                              type='button'
                              variant='outline'
                              className='mt-4 h-11 w-full rounded-2xl border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:hover:bg-sky-950/30'
                              onClick={() => handleDownloadReceipt(pago)}
                              title={t('Descargar recibo PDF', 'Download PDF receipt')}
                            >
                              <ReceiptText className='mr-2 h-4 w-4' />{t('Descargar recibo', 'Download receipt')}</Button>
                          </article>
                        ))}
                      </div>

                      <div className='hidden overflow-x-auto rounded-2xl border md:block'>
                        <table className='w-full text-sm'>
                          <thead className='bg-muted/40'>
                            <tr>
                              <th className='px-4 py-3 text-left'>{t('Fecha pago', 'Payment date')}</th>
                              <th className='px-4 py-3 text-left'>{t('Cuota', 'Fee')}</th>
                              <th className='px-4 py-3 text-left'>{t('Período cubierto', 'Covered period')}</th>
                              <th className='px-4 py-3 text-left'>{t('Meses', 'Months')}</th>
                              <th className='px-4 py-3 text-left'>{t('Método', 'Method')}</th>
                              <th className='px-4 py-3 text-left'>{t('Estado', 'Status')}</th>
                              <th className='px-4 py-3 text-right'>{t('Monto', 'Amount')}</th>
                              <th className='px-4 py-3 text-right'>{t('Recibo', 'Receipt')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagosOrdenados.map((pago) => (
                              <tr key={pago.id} className='border-t'>
                                <td className='whitespace-nowrap px-4 py-3'>{formatDate(pago.fecha_pago)}</td>
                                <td className='px-4 py-3'>
                                  <div className='font-medium'>{translateFeeDescription(locale, pago.cuota?.descripcion)}</div>
                                  <div className='text-xs text-muted-foreground'>{pago.cuota?.periodo ?? '-'}</div>
                                </td>
                                <td className='whitespace-nowrap px-4 py-3'>
                                  <div className='flex items-center gap-1'>
                                    <Clock className='h-3 w-3 text-muted-foreground' />
                                    {formatDate(pago.periodo_desde)} → {formatDate(pago.periodo_hasta)}
                                  </div>
                                </td>
                                <td className='px-4 py-3'>{pago.meses_cubiertos ?? '-'}</td>
                                <td className='px-4 py-3'>
                                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${badgeClass(pago.metodo_pago)}`}>
                                    {label(locale, pago.metodo_pago)}
                                  </span>
                                </td>
                                <td className='px-4 py-3'>
                                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${badgeClass(pago.estado)}`}>
                                    {label(locale, pago.estado)}
                                  </span>
                                </td>
                                <td className='whitespace-nowrap px-4 py-3 text-right'>
                                  <div className='font-semibold'>{formatMoney(pago.monto_pagado, locale)}</div>
                                  {Number(pago.descuento_monto ?? 0) > 0 ? (
                                    <div className='text-xs text-emerald-700 dark:text-emerald-300'>
                                      {t('Desc.', 'Disc.')} {formatMoney(pago.descuento_monto, locale)}
                                    </div>
                                  ) : null}
                                </td>
                                <td className='px-4 py-3 text-right'>
                                  <Button
                                    type='button'
                                    size='sm'
                                    variant='outline'
                                    className='border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:hover:bg-sky-950/30'
                                    onClick={() => handleDownloadReceipt(pago)}
                                    title={t('Descargar recibo PDF', 'Download PDF receipt')}
                                  >
                                    <ReceiptText className='mr-2 h-4 w-4' />{t('Recibo', 'Receipt')}</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
