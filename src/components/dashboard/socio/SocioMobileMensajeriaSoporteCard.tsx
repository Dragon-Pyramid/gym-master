'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Inbox,
  Loader2,
  MessageCircle,
  MessageSquarePlus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { SocioMensaje } from '@/interfaces/socioMensaje.interface';
import { getMisMensajesSocio } from '@/services/apiClient';
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';

function getEstadoLabel(t: (key: string) => string): Record<string, string> {
  return {
    pendiente: t('socioDashboard.messages.statusPending'),
    leido: t('socioDashboard.messages.statusRead'),
    respondido: t('socioDashboard.messages.statusAnswered'),
    cerrado: t('socioDashboard.messages.statusClosed'),
  };
}

function getLatestMessage(messages: SocioMensaje[]): SocioMensaje | undefined {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.actualizado_en ?? a.creado_en).getTime();
    const dateB = new Date(b.actualizado_en ?? b.creado_en).getTime();
    return dateB - dateA;
  })[0];
}

export default function SocioMobileMensajeriaSoporteCard() {
  const router = useRouter();
  const { t } = useI18n();
  const [messages, setMessages] = useState<SocioMensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMisMensajesSocio();
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(response.error || t('socioDashboard.messages.fetchError'));
        }

        setMessages(response.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setMessages([]);
        setError(err instanceof Error ? err.message : t('socioDashboard.messages.fetchError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const totals = useMemo(() => {
    return messages.reduce(
      (acc, message) => {
        acc.total += 1;
        acc.pendientes += message.estado === 'pendiente' ? 1 : 0;
        acc.respondidos += message.estado === 'respondido' ? 1 : 0;
        return acc;
      },
      { total: 0, pendientes: 0, respondidos: 0 }
    );
  }, [messages]);

  const latestMessage = useMemo(() => getLatestMessage(messages), [messages]);
  const hasResponses = totals.respondidos > 0;
  const hasPending = totals.pendientes > 0;

  const statusLabel = loading
    ? t('socioDashboard.messages.loading')
    : error
      ? t('socioDashboard.messages.unavailable')
      : hasResponses
        ? t('socioDashboard.messages.answersReady')
        : hasPending
          ? t('socioDashboard.messages.requestSent')
          : totals.total > 0
            ? t('socioDashboard.messages.noPending')
            : t('socioDashboard.messages.channelAvailable');

  const statusDescription = loading
    ? t('socioDashboard.messages.loadingDescription')
    : error
      ? t('socioDashboard.messages.errorDescription')
      : hasResponses
        ? t('socioDashboard.messages.answersDescription')
        : hasPending
          ? t('socioDashboard.messages.pendingDescription')
          : totals.total > 0
            ? t('socioDashboard.messages.noPendingDescription')
            : t('socioDashboard.messages.availableDescription');

  return (
    <Card className='overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80'>
      <div className='bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 text-white'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-start gap-3'>
            <div className='rounded-2xl bg-white/10 p-2'>
              <MessageCircle className='h-5 w-5 text-cyan-200' />
            </div>
            <div className='min-w-0'>
              <p className='text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200'>
                {t('socioDashboard.messages.eyebrow')}
              </p>
              <h2 className='mt-1 text-lg font-black'>{t('socioDashboard.messages.title')}</h2>
              <p className='mt-1 text-sm leading-5 text-slate-300'>
                {t('socioDashboard.messages.description')}
              </p>
            </div>
          </div>
          <span className='shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-950'>
            {t('socioDashboard.greeting.memberRole')}
          </span>
        </div>
      </div>

      <div className='space-y-4 p-4'>
        <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60'>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 rounded-full bg-white p-2 text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'>
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : error ? (
                <AlertCircle className='h-4 w-4 text-amber-600' />
              ) : hasResponses ? (
                <Inbox className='h-4 w-4 text-cyan-600' />
              ) : (
                <CheckCircle2 className='h-4 w-4 text-emerald-600' />
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-bold text-slate-950 dark:text-slate-50'>{statusLabel}</p>
              <p className='mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300'>{statusDescription}</p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-2 text-center'>
          <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60'>
            <p className='text-lg font-black text-slate-950 dark:text-slate-50'>{loading ? '-' : totals.total}</p>
            <p className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>{t('socioDashboard.messages.total')}</p>
          </div>
          <div className='rounded-2xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/70 dark:bg-amber-950/30'>
            <p className='text-lg font-black text-amber-700 dark:text-amber-300'>{loading ? '-' : totals.pendientes}</p>
            <p className='text-[11px] font-medium text-amber-700/80 dark:text-amber-200/80'>{t('socioDashboard.messages.pending')}</p>
          </div>
          <div className='rounded-2xl border border-cyan-100 bg-cyan-50 p-3 dark:border-cyan-900/70 dark:bg-cyan-950/30'>
            <p className='text-lg font-black text-cyan-700 dark:text-cyan-300'>{loading ? '-' : totals.respondidos}</p>
            <p className='text-[11px] font-medium text-cyan-700/80 dark:text-cyan-200/80'>{t('socioDashboard.messages.answered')}</p>
          </div>
        </div>

        {latestMessage ? (
          <div className='rounded-2xl border border-slate-100 p-3 dark:border-slate-800'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-bold'>{latestMessage.asunto}</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {getEstadoLabel(t)[latestMessage.estado] ?? latestMessage.estado} · {formatFrontendDateTime(latestMessage.actualizado_en ?? latestMessage.creado_en)}
                </p>
              </div>
              <span className='shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold'>
                {latestMessage.categoria}
              </span>
            </div>
            <p className='mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground'>
              {latestMessage.respuesta || latestMessage.mensaje}
            </p>
          </div>
        ) : null}

        <div className='grid grid-cols-2 gap-2'>
          <button
            type='button'
            onClick={() => router.push('/dashboard/mensajes')}
            className='flex items-center justify-center gap-2 rounded-xl bg-[#02a8e1] px-3 py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]'
          >
            <MessageSquarePlus className='h-4 w-4' />
            {t('socioDashboard.messages.newMessage')}
          </button>
          <button
            type='button'
            onClick={() => router.push('/dashboard/mensajes')}
            className='flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 shadow-sm transition active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'
          >
            {t('socioDashboard.messages.openInbox')}
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>
      </div>
    </Card>
  );
}
