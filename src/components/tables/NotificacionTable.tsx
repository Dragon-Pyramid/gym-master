'use client';

import { Button } from '@/components/ui/button';
import { Notificacion } from '@/interfaces/notificacion.interface';
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import { BellRing, CalendarClock, Eye, Mail, Pencil, Send, SquareTerminal, XCircle } from 'lucide-react';


function notificationTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function notificationValue(locale: GymMasterLocale, value?: string | null) {
  const labels: Record<string, { es: string; en: string }> = {
    general: { es: 'General', en: 'General' },
    feriado: { es: 'Feriado', en: 'Holiday' },
    promocion: { es: 'Promoción', en: 'Promotion' },
    stock: { es: 'Stock', en: 'Stock' },
    cumpleanos: { es: 'Cumpleaños', en: 'Birthday' },
    cuota: { es: 'Cuota', en: 'Fee' },
    recordatorio: { es: 'Recordatorio', en: 'Reminder' },
    sistema: { es: 'Sistema', en: 'System' },
    otro: { es: 'Otro', en: 'Other' },
    email: { es: 'Email', en: 'Email' },
    terminal: { es: 'Terminal', en: 'Terminal' },
    email_terminal: { es: 'Email + Terminal', en: 'Email + Terminal' },
    borrador: { es: 'Borrador', en: 'Draft' },
    programada: { es: 'Programada', en: 'Scheduled' },
    enviada: { es: 'Enviada', en: 'Sent' },
    cancelada: { es: 'Cancelada', en: 'Cancelled' },
    error: { es: 'Error', en: 'Error' },
  };
  const key = String(value ?? '').toLowerCase();
  const match = labels[key];
  if (match) return notificationTx(locale, match.es, match.en);
  return String(value ?? '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function estadoClass(estado: string) {
  if (estado === 'enviada') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/70';
  if (estado === 'programada') return 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-800/70';
  if (estado === 'cancelada') return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-800/70';
  if (estado === 'error') return 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-100 dark:ring-orange-800/70';
  return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700/70';
}


function NotificacionMobileCard({
  notificacion,
  onView,
  onEdit,
  onCancel,
  onSend,
}: {
  notificacion: Notificacion;
  onView: (notificacion: Notificacion) => void;
  onEdit: (notificacion: Notificacion) => void;
  onCancel: (notificacion: Notificacion) => void;
  onSend: (notificacion: Notificacion) => void;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => notificationTx(locale, es, en);

  return (
    <article className='rounded-[1.5rem] border border-border bg-background p-4 shadow-sm dark:bg-slate-950/80'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground'>
            <BellRing className='h-4 w-4' />
            {c('Notificación', 'Notification')}
          </div>
          <h3 className='mt-2 break-words text-base font-black leading-tight text-foreground'>
            {notificacion.titulo}
          </h3>
          <p className='mt-1 line-clamp-2 break-words text-sm leading-5 text-muted-foreground'>
            {notificacion.asunto}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ring-1 ${estadoClass(notificacion.estado)}`}>
          {notificationValue(locale, notificacion.estado)}
        </span>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-2 text-sm'>
        <div className='rounded-2xl border border-border/70 bg-muted/30 p-3'>
          <p className='text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground'>{c('Tipo', 'Type')}</p>
          <p className='mt-1 font-semibold text-foreground'>{notificationValue(locale, notificacion.tipo)}</p>
        </div>
        <div className='rounded-2xl border border-border/70 bg-muted/30 p-3'>
          <p className='text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground'>{c('Canal', 'Channel')}</p>
          <p className='mt-1 font-semibold text-foreground'>{notificationValue(locale, notificacion.canal)}</p>
        </div>
      </div>

      <div className='mt-3 space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm'>
        <div className='flex items-start gap-2'>
          <CalendarClock className='mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300' />
          <div>
            <p className='font-semibold text-foreground'>{c('Programada', 'Scheduled')}</p>
            <p className='text-muted-foreground'>{formatFrontendDateTime(notificacion.fecha_programada)}</p>
            <p className='text-xs text-muted-foreground'>{c('Hasta', 'Until')}: {formatFrontendDateTime(notificacion.fecha_vigencia_hasta)}</p>
          </div>
        </div>
        <div className='flex items-start gap-2'>
          <Mail className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300' />
          <div>
            <p className='font-semibold text-foreground'>{c('Envíos', 'Deliveries')}</p>
            <p className='text-muted-foreground'>{notificacion.total_enviados}/{notificacion.total_destinatarios} {c('destinatarios', 'recipients')}</p>
            {notificacion.total_errores > 0 ? (
              <p className='text-xs font-semibold text-red-600 dark:text-red-300'>{c('Errores', 'Errors')}: {notificacion.total_errores}</p>
            ) : null}
          </div>
        </div>
        <div className='flex items-start gap-2'>
          <SquareTerminal className='mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300' />
          <div>
            <p className='font-semibold text-foreground'>{c('Terminal', 'Terminal')}</p>
            <p className='text-muted-foreground'>
              {notificacion.mostrar_terminal
                ? notificacion.terminal_visible
                  ? c('Visible en terminal', 'Visible in terminal')
                  : c('Configurada, no visible', 'Configured, not visible')
                : c('No visible en terminal', 'Not visible in terminal')}
            </p>
          </div>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-2'>
        <Button type='button' variant='outline' onClick={() => onView(notificacion)} className='w-full'>
          <Eye className='mr-2 h-4 w-4' /> {c('Ver', 'View')}
        </Button>
        <Button type='button' variant='outline' onClick={() => onEdit(notificacion)} className='w-full'>
          <Pencil className='mr-2 h-4 w-4' /> {c('Editar', 'Edit')}
        </Button>
        {notificacion.estado !== 'enviada' && notificacion.estado !== 'cancelada' ? (
          <Button type='button' variant='outline' onClick={() => onSend(notificacion)} className='w-full'>
            <Send className='mr-2 h-4 w-4' /> {c('Enviar', 'Send')}
          </Button>
        ) : null}
        {notificacion.estado !== 'cancelada' ? (
          <Button type='button' variant='destructive' onClick={() => onCancel(notificacion)} className='w-full'>
            <XCircle className='mr-2 h-4 w-4' /> {c('Cancelar', 'Cancel')}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function NotificacionTable({
  notificaciones,
  onView,
  onEdit,
  onCancel,
  onSend,
}: {
  notificaciones: Notificacion[];
  onView: (notificacion: Notificacion) => void;
  onEdit: (notificacion: Notificacion) => void;
  onCancel: (notificacion: Notificacion) => void;
  onSend: (notificacion: Notificacion) => void;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => notificationTx(locale, es, en);

  if (notificaciones.length === 0) {
    return (
      <div className='rounded-[1.5rem] border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground'>
        {c('No hay notificaciones para los filtros seleccionados.', 'No notifications match the selected filters.')}
      </div>
    );
  }

  return (
    <>
      <div className='space-y-3 md:hidden'>
        {notificaciones.map((notificacion) => (
          <NotificacionMobileCard
            key={notificacion.id}
            notificacion={notificacion}
            onView={onView}
            onEdit={onEdit}
            onCancel={onCancel}
            onSend={onSend}
          />
        ))}
      </div>

      <div className='hidden overflow-x-auto md:block'>
        <table className='w-full text-left text-sm'>
          <thead>
            <tr className='border-b bg-muted/50'>
              <th className='px-4 py-3'>{c('Notificación', 'Notification')}</th>
              <th className='px-4 py-3'>{c('Tipo / canal', 'Type / channel')}</th>
              <th className='px-4 py-3'>{c('Estado', 'Status')}</th>
              <th className='px-4 py-3'>{c('Programada', 'Scheduled')}</th>
              <th className='px-4 py-3'>{c('Envíos', 'Deliveries')}</th>
              <th className='px-4 py-3'>{c('Terminal', 'Terminal')}</th>
              <th className='px-4 py-3 text-right'>{c('Acciones', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {notificaciones.map((notificacion) => (
              <tr key={notificacion.id} className='border-b hover:bg-muted/30'>
                <td className='px-4 py-3'>
                  <div className='font-semibold'>{notificacion.titulo}</div>
                  <div className='text-xs text-muted-foreground'>{notificacion.asunto}</div>
                </td>
                <td className='px-4 py-3'>
                  <div>{notificationValue(locale, notificacion.tipo)}</div>
                  <div className='text-xs text-muted-foreground'>{notificationValue(locale, notificacion.canal)}</div>
                </td>
                <td className='px-4 py-3'>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${estadoClass(notificacion.estado)}`}>
                    {notificationValue(locale, notificacion.estado)}
                  </span>
                </td>
                <td className='px-4 py-3'>
                  <div>{formatFrontendDateTime(notificacion.fecha_programada)}</div>
                  <div className='text-xs text-muted-foreground'>{c('Hasta', 'Until')}: {formatFrontendDateTime(notificacion.fecha_vigencia_hasta)}</div>
                </td>
                <td className='px-4 py-3'>
                  <div>{notificacion.total_enviados}/{notificacion.total_destinatarios}</div>
                  {notificacion.total_errores > 0 ? (
                    <div className='text-xs text-red-600'>{c('Errores', 'Errors')}: {notificacion.total_errores}</div>
                  ) : null}
                </td>
                <td className='px-4 py-3'>
                  {notificacion.mostrar_terminal ? (
                    <span className='rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950/50 dark:text-violet-100'>
                      {notificacion.terminal_visible ? c('Visible', 'Visible') : c('Oculta', 'Hidden')}
                    </span>
                  ) : (
                    <span className='text-muted-foreground'>{c('No', 'No')}</span>
                  )}
                </td>
                <td className='px-4 py-3'>
                  <div className='flex justify-end gap-2'>
                    <Button type='button' size='sm' variant='outline' onClick={() => onView(notificacion)} title={c('Ver', 'View')}>
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button type='button' size='sm' variant='outline' onClick={() => onEdit(notificacion)} title={c('Editar', 'Edit')}>
                      <Pencil className='h-4 w-4' />
                    </Button>
                    {notificacion.estado !== 'enviada' && notificacion.estado !== 'cancelada' ? (
                      <Button type='button' size='sm' variant='outline' onClick={() => onSend(notificacion)} title={c('Enviar/preparar', 'Send/prepare')}>
                        <Send className='h-4 w-4' />
                      </Button>
                    ) : null}
                    {notificacion.estado !== 'cancelada' ? (
                      <Button type='button' size='sm' variant='destructive' onClick={() => onCancel(notificacion)} title={c('Cancelar', 'Cancel')}>
                        <XCircle className='h-4 w-4' />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
