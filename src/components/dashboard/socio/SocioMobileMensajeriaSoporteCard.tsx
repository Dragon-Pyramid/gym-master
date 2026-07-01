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

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  leido: 'Leído por administración',
  respondido: 'Respondido',
  cerrado: 'Cerrado',
};

function getLatestMessage(messages: SocioMensaje[]): SocioMensaje | undefined {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.actualizado_en ?? a.creado_en).getTime();
    const dateB = new Date(b.actualizado_en ?? b.creado_en).getTime();
    return dateB - dateA;
  })[0];
}

export default function SocioMobileMensajeriaSoporteCard() {
  const router = useRouter();
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
          throw new Error(response.error || 'No se pudieron consultar los mensajes.');
        }

        setMessages(response.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setMessages([]);
        setError(err instanceof Error ? err.message : 'No se pudieron consultar los mensajes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, []);

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
    ? 'Consultando mensajes...'
    : error
      ? 'No se pudo consultar'
      : hasResponses
        ? 'Tenés respuestas para revisar'
        : hasPending
          ? 'Consulta enviada'
          : totals.total > 0
            ? 'Sin mensajes pendientes'
            : 'Canal disponible';

  const statusDescription = loading
    ? 'Estamos revisando tu bandeja de mensajes.'
    : error
      ? 'Podés entrar igual a mensajes y volver a intentar desde allí.'
      : hasResponses
        ? 'Administración respondió una o más consultas. Revisá la bandeja cuando puedas.'
        : hasPending
          ? 'Tu consulta ya fue enviada al gimnasio. Te avisaremos cuando tenga respuesta.'
          : totals.total > 0
            ? 'No tenés respuestas nuevas ni consultas pendientes.'
            : 'Escribí al gimnasio por dudas de cuota, horarios, rutinas, reclamos o sugerencias.';

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
                Mensajería
              </p>
              <h2 className='mt-1 text-lg font-black'>Soporte del gimnasio</h2>
              <p className='mt-1 text-sm leading-5 text-slate-300'>
                Consultas, reclamos, sugerencias y respuestas de administración.
              </p>
            </div>
          </div>
          <span className='shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-950'>
            Socio
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
            <p className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>Total</p>
          </div>
          <div className='rounded-2xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/70 dark:bg-amber-950/30'>
            <p className='text-lg font-black text-amber-700 dark:text-amber-300'>{loading ? '-' : totals.pendientes}</p>
            <p className='text-[11px] font-medium text-amber-700/80 dark:text-amber-200/80'>Pendientes</p>
          </div>
          <div className='rounded-2xl border border-cyan-100 bg-cyan-50 p-3 dark:border-cyan-900/70 dark:bg-cyan-950/30'>
            <p className='text-lg font-black text-cyan-700 dark:text-cyan-300'>{loading ? '-' : totals.respondidos}</p>
            <p className='text-[11px] font-medium text-cyan-700/80 dark:text-cyan-200/80'>Respondidos</p>
          </div>
        </div>

        {latestMessage ? (
          <div className='rounded-2xl border border-slate-100 p-3 dark:border-slate-800'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-bold'>{latestMessage.asunto}</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {estadoLabel[latestMessage.estado] ?? latestMessage.estado} · {formatFrontendDateTime(latestMessage.actualizado_en ?? latestMessage.creado_en)}
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
            Enviar consulta
          </button>
          <button
            type='button'
            onClick={() => router.push('/dashboard/mensajes')}
            className='flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 shadow-sm transition active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'
          >
            Ver mensajes
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>
      </div>
    </Card>
  );
}
