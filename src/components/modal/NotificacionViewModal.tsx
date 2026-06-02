'use client';

import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Notificacion } from '@/interfaces/notificacion.interface';
import { formatFrontendDateTime } from '@/utils/dateFormat';

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  return (
    <label className='space-y-1 text-sm font-medium'>
      {label}
      <div className='rounded-md border bg-muted/40 px-3 py-2 font-normal'>
        {value === null || value === undefined || value === '' ? '-' : String(value)}
      </div>
    </label>
  );
}

export default function NotificacionViewModal({
  open,
  onClose,
  notificacion,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  notificacion?: Notificacion | null;
  onSend?: (notificacion: Notificacion) => void;
}) {
  if (!notificacion) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-full max-w-5xl'>
        <QaFileNameBadge file='src/components/modal/NotificacionViewModal.tsx' />
        <DialogHeader>
          <div className='flex w-full items-center justify-between gap-4'>
            <DialogTitle>Detalle de notificación</DialogTitle>
            <div className='text-sm text-muted-foreground'>{formatFrontendDateTime(new Date())}</div>
          </div>
        </DialogHeader>

        <div className='grid gap-4 md:grid-cols-2'>
          <Field label='Título' value={notificacion.titulo} />
          <Field label='Asunto' value={notificacion.asunto} />
          <Field label='Tipo' value={notificacion.tipo} />
          <Field label='Canal' value={notificacion.canal} />
          <Field label='Estado' value={notificacion.estado} />
          <Field label='Destinatarios' value={notificacion.destinatario_segmento} />
          <Field label='Programada' value={formatFrontendDateTime(notificacion.fecha_programada)} />
          <Field label='Enviada' value={formatFrontendDateTime(notificacion.fecha_enviada)} />
          <Field label='Total destinatarios' value={notificacion.total_destinatarios} />
          <Field label='Total enviados' value={notificacion.total_enviados} />
          <Field label='Terminal' value={notificacion.mostrar_terminal ? 'Sí' : 'No'} />
          <Field label='Terminal visible' value={notificacion.terminal_visible ? 'Sí' : 'No'} />
        </div>

        <div className='rounded-xl border bg-muted/40 p-4 text-sm'>
          <div className='font-semibold'>Mensaje</div>
          <p className='mt-2 whitespace-pre-wrap text-muted-foreground'>{notificacion.cuerpo}</p>
        </div>

        {notificacion.envios && notificacion.envios.length > 0 ? (
          <div className='rounded-xl border p-4'>
            <div className='mb-3 font-semibold'>Últimos envíos</div>
            <div className='max-h-60 overflow-auto'>
              <table className='w-full text-left text-sm'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    <th className='px-3 py-2'>Socio</th>
                    <th className='px-3 py-2'>Email</th>
                    <th className='px-3 py-2'>Estado</th>
                    <th className='px-3 py-2'>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {notificacion.envios.map((envio) => (
                    <tr key={envio.id} className='border-b'>
                      <td className='px-3 py-2'>{envio.nombre_destinatario ?? '-'}</td>
                      <td className='px-3 py-2'>{envio.email ?? '-'}</td>
                      <td className='px-3 py-2'>{envio.estado}</td>
                      <td className='px-3 py-2'>{formatFrontendDateTime(envio.enviado_en)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className='flex justify-end gap-2'>
          {onSend && notificacion.estado !== 'enviada' && notificacion.estado !== 'cancelada' ? (
            <Button type='button' onClick={() => onSend(notificacion)}>
              Preparar/envíar a socios
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
