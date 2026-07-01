'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  History,
  Loader2,
  ReceiptText,
  WalletCards,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getToken } from '@/services/storageService';
import { formatFrontendDate } from '@/utils/dateFormat';
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

type SocioMobilePagosRecibosCardProps = {
  cuotaAlDia: boolean;
  cuotaEstadoLabel: string;
  cuotaFechaTitulo: string;
  cuotaFechaLabel: string;
  loadingEstadoCuota?: boolean;
  montoAdeudadoLabel?: string;
};

function formatMoney(value?: number | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('es-AR', {
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

function label(value?: string | null) {
  if (!value) return '-';
  if (value === 'stripe') return 'Stripe';
  if (value === 'efectivo') return 'Efectivo';
  if (value === 'transferencia') return 'Transferencia';
  if (value === 'pagado') return 'Pagado';
  if (value === 'pendiente') return 'Pendiente';
  if (value === 'cancelado') return 'Cancelado';
  return value.replace(/_/g, ' ');
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
    fecha_vencimiento: pago.fecha_vencimiento ?? pago.periodo_hasta ?? pago.fecha_pago,
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

export default function SocioMobilePagosRecibosCard({
  cuotaAlDia,
  cuotaEstadoLabel,
  cuotaFechaTitulo,
  cuotaFechaLabel,
  loadingEstadoCuota = false,
  montoAdeudadoLabel = '$ 0',
}: SocioMobilePagosRecibosCardProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<PagoSocio[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPayments = async () => {
      try {
        setLoadingPayments(true);
        setError(null);
        const token = getToken();
        const response = await fetch('/api/mi-cuenta/pagos', {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const payload = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(payload.error || 'No se pudo obtener el historial de pagos.');
        }

        setPayments(Array.isArray(payload.data) ? payload.data : []);
      } catch (err) {
        if (cancelled) return;
        setPayments([]);
        setError(err instanceof Error ? err.message : 'No se pudo obtener el historial de pagos.');
      } finally {
        if (!cancelled) setLoadingPayments(false);
      }
    };

    loadPayments();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPayments = useMemo(() => sortPayments(payments), [payments]);
  const latestPayment = sortedPayments[0];
  const totalPagado = useMemo(
    () => payments.reduce((acc, payment) => acc + Number(payment.monto_pagado ?? 0), 0),
    [payments]
  );

  const hasPayments = payments.length > 0;
  const canDownloadReceipt = Boolean(latestPayment?.id && latestPayment?.estado !== 'cancelado');

  const statusDescription = loadingEstadoCuota
    ? 'Estamos consultando tu estado de cuota.'
    : cuotaAlDia
      ? 'Tu cuota figura al día. Revisá tus recibos y conservá el comprobante de tus pagos.'
      : 'Tenés un importe pendiente. Regularizá tu cuota para mantener el acceso sin alertas.';

  const handleDownloadLatestReceipt = async () => {
    if (!latestPayment) return;

    try {
      setDownloading(true);
      await descargarPagoReciboPdf(toReceiptPayload(latestPayment));
      toast.success('Recibo PDF generado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar el recibo PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className='overflow-hidden border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-4 shadow-sm dark:border-emerald-900/60 dark:from-slate-950 dark:via-emerald-950/20 dark:to-sky-950/20'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300'>
            Pagos y recibos
          </p>
          <h2 className='mt-1 text-xl font-black leading-tight'>Mi cuenta</h2>
          <p className='mt-2 text-sm leading-5 text-muted-foreground'>
            Consultá tu cuota, último pago y comprobantes desde el celular.
          </p>
        </div>
        <div className='shrink-0 rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'>
          <WalletCards className='h-6 w-6' />
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border p-3 ${cuotaAlDia ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-50' : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-50'}`}>
        <div className='flex items-start gap-3'>
          {cuotaAlDia ? (
            <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300' />
          ) : (
            <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300' />
          )}
          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between gap-2'>
              <p className='text-sm font-black'>
                {loadingEstadoCuota ? 'Consultando cuota...' : cuotaEstadoLabel}
              </p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cuotaAlDia ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'}`}>
                {cuotaAlDia ? 'Sin deuda' : montoAdeudadoLabel}
              </span>
            </div>
            <p className='mt-1 text-xs leading-5 opacity-80'>{statusDescription}</p>
            <div className='mt-3 flex items-center gap-2 text-xs font-semibold'>
              <CalendarClock className='h-4 w-4' />
              {cuotaFechaTitulo}: {cuotaFechaLabel}
            </div>
          </div>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-3'>
        <div className='rounded-2xl border border-border/70 bg-background/70 p-3'>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground'>
            <ReceiptText className='h-4 w-4' />
            Último pago
          </div>
          {loadingPayments ? (
            <div className='flex items-center gap-2 text-sm font-semibold text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Cargando...
            </div>
          ) : error ? (
            <p className='text-sm font-semibold text-amber-700 dark:text-amber-300'>A revisar</p>
          ) : latestPayment ? (
            <>
              <p className='text-base font-black'>{formatMoney(latestPayment.monto_pagado)}</p>
              <p className='mt-1 text-xs text-muted-foreground'>{formatDate(latestPayment.fecha_pago)}</p>
            </>
          ) : (
            <p className='text-sm font-semibold text-muted-foreground'>Sin pagos</p>
          )}
        </div>

        <div className='rounded-2xl border border-border/70 bg-background/70 p-3'>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground'>
            <History className='h-4 w-4' />
            Historial
          </div>
          {loadingPayments ? (
            <p className='text-sm font-semibold text-muted-foreground'>Consultando...</p>
          ) : (
            <>
              <p className='text-base font-black'>{payments.length}</p>
              <p className='mt-1 text-xs text-muted-foreground'>pagos registrados</p>
            </>
          )}
        </div>
      </div>

      {hasPayments && latestPayment ? (
        <div className='mt-3 rounded-2xl border border-emerald-100 bg-white/70 p-3 text-sm dark:border-emerald-900/50 dark:bg-slate-950/40'>
          <div className='flex items-start gap-3'>
            <FileText className='mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300' />
            <div className='min-w-0'>
              <p className='font-bold'>Último comprobante disponible</p>
              <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                {latestPayment.cuota?.descripcion ?? 'Cuota'} · {label(latestPayment.metodo_pago)} · {label(latestPayment.estado)}
              </p>
              <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                Total histórico registrado: {formatMoney(totalPagado)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className='mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200'>
          {error}. Podés entrar al historial y volver a intentar desde allí.
        </div>
      ) : null}

      <div className='mt-4 grid grid-cols-2 gap-3'>
        <button
          type='button'
          onClick={() => router.push('/dashboard/mi-cuenta/pagar-cuota')}
          className={`flex min-h-[78px] flex-col justify-between rounded-2xl px-3 py-3 text-left transition active:scale-[0.98] ${cuotaAlDia ? 'border border-emerald-200 bg-white text-emerald-950 shadow-sm dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-50' : 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/10'}`}
        >
          <div className='flex items-center justify-between gap-2'>
            <CreditCard className='h-5 w-5' />
            <ChevronRight className='h-4 w-4 opacity-60' />
          </div>
          <div>
            <p className='text-sm font-black'>{cuotaAlDia ? 'Mi cuenta' : 'Pagar cuota'}</p>
            <p className='text-xs opacity-75'>{cuotaAlDia ? 'Ver opciones' : 'Regularizar'}</p>
          </div>
        </button>

        <button
          type='button'
          onClick={() => router.push('/dashboard/mi-cuenta/historial-pagos')}
          className='flex min-h-[78px] flex-col justify-between rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-left text-sky-950 transition active:scale-[0.98] dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-50'
        >
          <div className='flex items-center justify-between gap-2'>
            <History className='h-5 w-5' />
            <ChevronRight className='h-4 w-4 opacity-60' />
          </div>
          <div>
            <p className='text-sm font-black'>Historial</p>
            <p className='text-xs opacity-75'>Pagos y recibos</p>
          </div>
        </button>
      </div>

      <button
        type='button'
        onClick={handleDownloadLatestReceipt}
        disabled={!canDownloadReceipt || downloading}
        className='mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900 dark:bg-slate-950 dark:text-emerald-200'
      >
        {downloading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
        {hasPayments ? 'Descargar último recibo' : 'Sin recibos disponibles'}
      </button>
    </Card>
  );
}
