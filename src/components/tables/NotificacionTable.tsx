'use client';

import { Button } from '@/components/ui/button';
import { Notificacion } from '@/interfaces/notificacion.interface';
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { Eye, Pencil, Send, XCircle } from 'lucide-react';

function estadoClass(estado: string) {
  if (estado === 'enviada') return 'bg-emerald-100 text-emerald-800';
  if (estado === 'programada') return 'bg-sky-100 text-sky-800';
  if (estado === 'cancelada') return 'bg-red-100 text-red-800';
  if (estado === 'error') return 'bg-orange-100 text-orange-800';
  return 'bg-slate-100 text-slate-800';
}

function normalizeLabel(value?: string | null) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  return (
    <div className='overflow-x-auto'>
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
                  <span className='rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800'>
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
          {notificaciones.length === 0 ? (
            <tr>
              <td colSpan={7} className='px-4 py-10 text-center text-muted-foreground'>
                No hay notificaciones para los filtros seleccionados.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
