'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AdminCuotasEstadoResponse,
  EstadoCuotaSocio,
} from '@/interfaces/cuotaEstado.interface';
import { getAdminCuotasEstadoSocios } from '@/services/apiClient';
import { useI18n } from '@/i18n/I18nProvider';

type TranslationFn = (key: string, params?: Record<string, string | number | boolean | null | undefined>) => string;

function formatDate(value: string | null, locale: string): string {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function estadoLabel(estado: EstadoCuotaSocio['estado_cuota'], t: TranslationFn) {
  if (estado === 'al_dia') return t('adminDashboard.quotas.statusUpToDate');
  if (estado === 'vencido') return t('adminDashboard.quotas.statusOverdue');
  return t('adminDashboard.quotas.statusNoPayments');
}

function paymentMethodLabel(value: string | null | undefined, t: TranslationFn) {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (!normalized) return '-';
  if (normalized === 'efectivo') return t('adminDashboard.quotas.methodCash');
  if (normalized === 'transferencia') return t('adminDashboard.quotas.methodTransfer');
  if (normalized === 'stripe') return 'Stripe';
  if (normalized === 'otro') return t('adminDashboard.quotas.methodOther');

  return String(value).replace(/_/g, ' ');
}

function paymentStateLabel(value: string | null | undefined, t: TranslationFn) {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (!normalized) return '-';
  if (normalized === 'pagado') return t('adminDashboard.quotas.paymentPaid');
  if (normalized === 'pendiente') return t('adminDashboard.quotas.paymentPending');
  if (normalized === 'cancelado') return t('adminDashboard.quotas.paymentCancelled');

  return String(value).replace(/_/g, ' ');
}

function EstadoBadge({
  estado,
  t,
}: {
  estado: EstadoCuotaSocio['estado_cuota'];
  t: TranslationFn;
}) {
  const className =
    estado === 'al_dia'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : estado === 'vencido'
      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
      {estadoLabel(estado, t)}
    </span>
  );
}

function SociosCriticosTable({
  socios,
  t,
  locale,
}: {
  socios: EstadoCuotaSocio[];
  t: TranslationFn;
  locale: string;
}) {
  if (socios.length === 0) {
    return (
      <div className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
        {t('adminDashboard.quotas.noCriticalMembers')}
      </div>
    );
  }

  return (
    <div className='overflow-x-auto rounded-xl border'>
      <table className='w-full min-w-[760px] text-sm'>
        <thead className='bg-muted/60 text-left'>
          <tr>
            <th className='px-4 py-3 font-semibold'>{t('adminDashboard.quotas.member')}</th>
            <th className='px-4 py-3 font-semibold'>{t('adminDashboard.quotas.status')}</th>
            <th className='px-4 py-3 font-semibold'>{t('adminDashboard.quotas.lastPayment')}</th>
            <th className='px-4 py-3 font-semibold'>{t('adminDashboard.quotas.coverageUntil')}</th>
            <th className='px-4 py-3 font-semibold'>{t('adminDashboard.quotas.daysOverdue')}</th>
            <th className='px-4 py-3 font-semibold'>{t('adminDashboard.quotas.method')}</th>
          </tr>
        </thead>
        <tbody>
          {socios.map((socio) => (
            <tr key={socio.id_socio} className='border-t'>
              <td className='px-4 py-3 font-medium'>{socio.nombre_completo}</td>
              <td className='px-4 py-3'>
                <EstadoBadge estado={socio.estado_cuota} t={t} />
              </td>
              <td className='px-4 py-3'>{formatDate(socio.ultimo_pago, locale)}</td>
              <td className='px-4 py-3'>{formatDate(socio.periodo_hasta, locale)}</td>
              <td className='px-4 py-3'>{socio.dias_vencido}</td>
              <td className='px-4 py-3 capitalize'>{paymentMethodLabel(socio.metodo_pago, t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CuotasEstadoDashboard() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<AdminCuotasEstadoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const result = await getAdminCuotasEstadoSocios();

    if (result.ok && result.data) {
      setData(result.data);
    } else {
      setError(result.error || t('adminDashboard.quotas.fetchError'));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [locale]);

  const sociosCriticos = useMemo(() => {
    if (!data) return [];

    return [...data.vencidos, ...data.sin_pagos].sort((a, b) => {
      if (a.estado_cuota === b.estado_cuota) {
        return a.nombre_completo.localeCompare(b.nombre_completo);
      }

      return a.estado_cuota === 'vencido' ? -1 : 1;
    });
  }, [data]);

  const totalCobrado = useMemo(() => {
    if (!data) return 0;
    return data.pagos_por_metodo.reduce((acc, item) => acc + item.total_pagado, 0);
  }, [data]);

  if (loading) {
    return (
      <Card className='md:col-span-2 xl:col-span-3'>
        <CardHeader>
          <CardTitle>{t('adminDashboard.quotas.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>{t('adminDashboard.quotas.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='md:col-span-2 xl:col-span-3 border-red-200 dark:border-red-900'>
        <CardHeader className='flex flex-row items-center justify-between gap-4'>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-500' />
            {t('adminDashboard.quotas.title')}
          </CardTitle>
          <Button variant='outline' size='sm' className='w-full md:w-auto' onClick={fetchData}>
            {t('adminDashboard.quotas.retry')}
          </Button>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-red-600 dark:text-red-300'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <section className='min-w-0 space-y-4 md:col-span-2 xl:col-span-3'>
      <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
        <div>
          <h2 className='text-xl font-bold sm:text-2xl'>{t('adminDashboard.quotas.title')}</h2>
          <p className='text-sm text-muted-foreground'>
            {t('adminDashboard.quotas.description')}
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={fetchData}>
          {t('adminDashboard.quotas.refresh')}
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Users className='h-4 w-4' />
              {t('adminDashboard.quotas.totalMembers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{data.resumen.total_socios}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <CheckCircle2 className='h-4 w-4 text-emerald-500' />
              {t('adminDashboard.quotas.upToDate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-emerald-600'>{data.resumen.al_dia}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <AlertTriangle className='h-4 w-4 text-red-500' />
              {t('adminDashboard.quotas.overdue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-red-600'>{data.resumen.vencidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <AlertTriangle className='h-4 w-4 text-amber-500' />
              {t('adminDashboard.quotas.noPayments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-amber-600'>{data.resumen.sin_pagos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <DollarSign className='h-4 w-4' />
              {t('adminDashboard.quotas.collected')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatMoney(totalCobrado, locale)}</div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader>
            <CardTitle>{t('adminDashboard.quotas.criticalMembers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SociosCriticosTable socios={sociosCriticos} t={t} locale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5' />
              {t('adminDashboard.quotas.paymentsByMethod')}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.pagos_por_metodo.length === 0 ? (
              <p className='text-sm text-muted-foreground'>{t('adminDashboard.quotas.noRegisteredPayments')}</p>
            ) : (
              data.pagos_por_metodo.map((item) => (
                <div
                  key={`${item.metodo_pago}-${item.estado}`}
                  className='flex items-center justify-between gap-3 rounded-xl border p-3'
                >
                  <div>
                    <p className='font-semibold capitalize'>{paymentMethodLabel(item.metodo_pago, t)}</p>
                    <p className='text-xs text-muted-foreground'>
                      {t('adminDashboard.quotas.paymentCountState', {
                        count: item.cantidad,
                        state: paymentStateLabel(item.estado, t),
                      })}
                    </p>
                  </div>
                  <p className='font-bold'>{formatMoney(item.total_pagado, locale)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
