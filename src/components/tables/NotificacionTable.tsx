'use client';

import { Button } from '@/components/ui/button';
import { Notificacion } from '@/interfaces/notificacion.interface';
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { BellRing, CalendarClock, Eye, Mail, Pencil, Send, SquareTerminal, XCircle } from 'lucide-react';

function estadoClass(estado: string) {
  if (estado === 'enviada') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-800/70';
  if (estado === 'programada') return 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-800/70';
  if (estado === 'cancelada') return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-800/70';
  if (estado === 'error') return 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-100 dark:ring-orange-800/70';
  return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700/70';
}

function normalizeLabel(value?: string | null) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  return (
    <article className='rounded-[1.5rem] border border-border bg-background p-4 shadow-sm dark:bg-slate-950/80'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground'>
            <BellRing className='h-4 w-4' />
            Notificación
          </div>
          <h3 className='mt-2 break-words text-base font-black leading-tight text-foreground'>
            {notificacion.titulo}
          </h3>
          <p className='mt-1 line-clamp-2 break-words text-sm leading-5 text-muted-foreground'>
            {notificacion.asunto}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ring-1 ${estadoClass(notificacion.estado)}`}>
          {normalizeLabel(notificacion.estado)}
        </span>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-2 text-sm'>
        <div className='rounded-2xl border border-border/70 bg-muted/30 p-3'>
          <p className='text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground'>Tipo</p>
          <p className='mt-1 font-semibold text-foreground'>{normalizeLabel(notificacion.tipo)}</p>
        </div>
        <div className='rounded-2xl border border-border/70 bg-muted/30 p-3'>
          <p className='text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground'>Canal</p>
          <p className='mt-1 font-semibold text-foreground'>{normalizeLabel(notificacion.canal)}</p>
        </div>
      </div>

      <div className='mt-3 space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm'>
        <div className='flex items-start gap-2'>
          <CalendarClock className='mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300' />
          <div>
            <p className='font-semibold text-foreground'>Programada</p>
            <p className='text-muted-foreground'>{formatFrontendDateTime(notificacion.fecha_programada)}</p>
            <p className='text-xs text-muted-foreground'>Hasta: {formatFrontendDateTime(notificacion.fecha_vigencia_hasta)}</p>
          </div>
        </div>
        <div className='flex items-start gap-2'>
          <Mail className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300' />
          <div>
            <p className='font-semibold text-foreground'>Envíos</p>
            <p className='text-muted-foreground'>{notificacion.total_enviados}/{notificacion.total_destinatarios} destinatarios</p>
            {notificacion.total_errores > 0 ? (
              <p className='text-xs font-semibold text-red-600 dark:text-red-300'>Errores: {notificacion.total_errores}</p>
            ) : null}
          </div>
        </div>
        <div className='flex items-start gap-2'>
          <SquareTerminal className='mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300' />
          <div>
            <p className='font-semibold text-foreground'>Terminal</p>
            <p className='text-muted-foreground'>
              {notificacion.mostrar_terminal
                ? notificacion.terminal_visible
                  ? 'Visible en terminal'
                  : 'Configurada, no visible'
                : 'No visible en terminal'}
            </p>
          </div>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-2'>
        <Button type='button' variant='outline' onClick={() => onView(notificacion)} className='w-full'>
          <Eye className='mr-2 h-4 w-4' /> Ver
        </Button>
        <Button type='button' variant='outline' onClick={() => onEdit(notificacion)} className='w-full'>
          <Pencil className='mr-2 h-4 w-4' /> Editar
        </Button>
        {notificacion.estado !== 'enviada' && notificacion.estado !== 'cancelada' ? (
          <Button type='button' variant='outline' onClick={() => onSend(notificacion)} className='w-full'>
            <Send className='mr-2 h-4 w-4' /> Enviar
          </Button>
        ) : null}
        {notificacion.estado !== 'cancelada' ? (
          <Button type='button' variant='destructive' onClick={() => onCancel(notificacion)} className='w-full'>
            <XCircle className='mr-2 h-4 w-4' /> Cancelar
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
  if (notificaciones.length === 0) {
    return (
      <div className='rounded-[1.5rem] border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground'>
        No hay notificaciones para los filtros seleccionados.
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
              <th className='px-4 py-3'>Notificación</th>
              <th className='px-4 py-3'>Tipo / canal</th>
              <th className='px-4 py-3'>Estado</th>
              <th className='px-4 py-3'>Programada</th>
              <th className='px-4 py-3'>Envíos</th>
              <th className='px-4 py-3'>Terminal</th>
              <th className='px-4 py-3 text-right'>Acciones</th>
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
                  <div>{normalizeLabel(notificacion.tipo)}</div>
                  <div className='text-xs text-muted-foreground'>{normalizeLabel(notificacion.canal)}</div>
                </td>
                <td className='px-4 py-3'>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${estadoClass(notificacion.estado)}`}>
                    {normalizeLabel(notificacion.estado)}
                  </span>
                </td>
                <td className='px-4 py-3'>
                  <div>{formatFrontendDateTime(notificacion.fecha_programada)}</div>
                  <div className='text-xs text-muted-foreground'>Hasta: {formatFrontendDateTime(notificacion.fecha_vigencia_hasta)}</div>
                </td>
                <td className='px-4 py-3'>
                  <div>{notificacion.total_enviados}/{notificacion.total_destinatarios}</div>
                  {notificacion.total_errores > 0 ? (
                    <div className='text-xs text-red-600'>Errores: {notificacion.total_errores}</div>
                  ) : null}
                </td>
                <td className='px-4 py-3'>
                  {notificacion.mostrar_terminal ? (
                    <span className='rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950/50 dark:text-violet-100'>
                      {notificacion.terminal_visible ? 'Visible' : 'Oculta'}
                    </span>
                  ) : (
                    <span className='text-muted-foreground'>No</span>
                  )}
                </td>
                <td className='px-4 py-3'>
                  <div className='flex justify-end gap-2'>
                    <Button type='button' size='sm' variant='outline' onClick={() => onView(notificacion)} title='Ver'>
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button type='button' size='sm' variant='outline' onClick={() => onEdit(notificacion)} title='Editar'>
                      <Pencil className='h-4 w-4' />
                    </Button>
                    {notificacion.estado !== 'enviada' && notificacion.estado !== 'cancelada' ? (
                      <Button type='button' size='sm' variant='outline' onClick={() => onSend(notificacion)} title='Enviar/preparar'>
                        <Send className='h-4 w-4' />
                      </Button>
                    ) : null}
                    {notificacion.estado !== 'cancelada' ? (
                      <Button type='button' size='sm' variant='destructive' onClick={() => onCancel(notificacion)} title='Cancelar'>
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
