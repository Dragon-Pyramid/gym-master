'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  History,
  QrCode,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import QrDisplayModal from '@/components/ui/qr-display';
import { useI18n } from '@/i18n/I18nProvider';

type SocioMobileAsistenciaQrCardProps = {
  cuotaAlDia: boolean;
  cuotaEstadoLabel: string;
  cuotaFechaTitulo: string;
  cuotaFechaLabel: string;
  loadingEstadoCuota?: boolean;
  montoAdeudadoLabel?: string;
};

export default function SocioMobileAsistenciaQrCard({
  cuotaAlDia,
  cuotaEstadoLabel,
  cuotaFechaTitulo,
  cuotaFechaLabel,
  loadingEstadoCuota = false,
  montoAdeudadoLabel = '$ 0',
}: SocioMobileAsistenciaQrCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [qrOpen, setQrOpen] = useState(false);

  const statusCopy = cuotaAlDia
    ? t('socioDashboard.fee.statusCopyOk')
    : t('socioDashboard.fee.statusCopyPending');

  return (
    <>
      <Card className='overflow-hidden border-indigo-100 bg-gradient-to-br from-indigo-950 via-slate-950 to-sky-950 text-white shadow-xl dark:border-indigo-900/70'>
        <div className='p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className='text-xs font-semibold uppercase tracking-[0.22em] text-sky-200'>
                {t('socioDashboard.attendance.eyebrow')}
              </p>
              <h2 className='mt-1 text-xl font-black leading-tight'>
                {t('socioDashboard.attendance.title')}
              </h2>
              <p className='mt-2 text-sm leading-5 text-slate-300'>
                {t('socioDashboard.attendance.description')}
              </p>
            </div>
            <div className='shrink-0 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10'>
              <QrCode className='h-7 w-7 text-sky-200' />
            </div>
          </div>

          <div className='mt-4 rounded-2xl border border-white/10 bg-white/10 p-3'>
            <div className='flex items-start gap-3'>
              {cuotaAlDia ? (
                <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-emerald-300' />
              ) : (
                <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-amber-300' />
              )}
              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='text-sm font-bold'>
                    {loadingEstadoCuota ? t('socioDashboard.fee.checking') : cuotaEstadoLabel}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      cuotaAlDia
                        ? 'bg-emerald-300/15 text-emerald-200'
                        : 'bg-amber-300/15 text-amber-200'
                    }`}
                  >
                    {cuotaAlDia ? t('socioDashboard.fee.enabledAccess') : t('socioDashboard.fee.reviewAccess')}
                  </span>
                </div>
                <p className='mt-1 text-xs leading-5 text-slate-300'>
                  {statusCopy}
                </p>
                <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                  <div className='rounded-xl bg-black/20 p-2'>
                    <p className='text-slate-400'>{cuotaFechaTitulo}</p>
                    <p className='mt-0.5 font-bold text-slate-100'>{cuotaFechaLabel}</p>
                  </div>
                  <div className='rounded-xl bg-black/20 p-2'>
                    <p className='text-slate-400'>{cuotaAlDia ? t('socioDashboard.common.debt') : t('socioDashboard.common.regularize')}</p>
                    <p className='mt-0.5 font-bold text-slate-100'>
                      {cuotaAlDia ? '$ 0' : montoAdeudadoLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => setQrOpen(true)}
              className='flex min-h-[84px] flex-col justify-between rounded-2xl bg-white px-3 py-3 text-left text-slate-950 shadow-lg shadow-black/10 transition active:scale-[0.98]'
            >
              <div className='flex items-center justify-between gap-2'>
                <QrCode className='h-5 w-5 text-indigo-700' />
                <ShieldCheck className='h-4 w-4 text-emerald-600' />
              </div>
              <div>
                <p className='text-sm font-black'>{t('socioDashboard.attendance.showQr')}</p>
                <p className='text-xs text-slate-600'>{t('socioDashboard.attendance.quickAccess')}</p>
              </div>
            </button>

            <button
              type='button'
              onClick={() => router.push('/dashboard/control-asistencia')}
              className='flex min-h-[84px] flex-col justify-between rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-left text-white transition active:scale-[0.98]'
            >
              <div className='flex items-center justify-between gap-2'>
                <ScanLine className='h-5 w-5 text-sky-200' />
                <QrCode className='h-4 w-4 text-slate-300' />
              </div>
              <div>
                <p className='text-sm font-black'>{t('socioDashboard.attendance.scanQr')}</p>
                <p className='text-xs text-slate-300'>{t('socioDashboard.attendance.attendanceControl')}</p>
              </div>
            </button>
          </div>

          <div className='mt-3 grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => router.push('/dashboard/mi-cuenta/historial-pagos')}
              className='flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-xs font-bold text-white transition active:scale-[0.98]'
            >
              <History className='h-4 w-4' />
              {t('socioDashboard.common.history')}
            </button>
            <button
              type='button'
              onClick={() => router.push('/dashboard/mi-cuenta/pagar-cuota')}
              className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-bold transition active:scale-[0.98] ${
                cuotaAlDia
                  ? 'border border-white/15 bg-white/10 text-white'
                  : 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/20'
              }`}
            >
              <CreditCard className='h-4 w-4' />
              {cuotaAlDia ? t('socioDashboard.common.account') : t('socioDashboard.fee.payFee')}
            </button>
          </div>
        </div>
      </Card>

      <QrDisplayModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
}
