'use client';

import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Notificacion } from '@/interfaces/notificacion.interface';
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';


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
    todos_socios: { es: 'Todos los socios con email', en: 'All members with email' },
    socios_activos: { es: 'Socios activos con email', en: 'Active members with email' },
    socios_cuota_al_dia: { es: 'Socios con cuota al día', en: 'Members with up-to-date fees' },
    manual: { es: 'Manual / personalizado', en: 'Manual / custom' },
  };
  const key = String(value ?? '').toLowerCase();
  const match = labels[key];
  if (match) return notificationTx(locale, match.es, match.en);
  return String(value ?? '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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
  const { locale } = useI18n();
  const c = (es: string, en: string) => notificationTx(locale, es, en);

  if (!notificacion) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-full max-w-5xl'>
        <QaFileNameBadge file='src/components/modal/NotificacionViewModal.tsx' />
        <DialogHeader>
          <div className='flex w-full items-center justify-between gap-4'>
            <DialogTitle>{c('Detalle de notificación', 'Notification detail')}</DialogTitle>
            <div className='text-sm text-muted-foreground'>{formatFrontendDateTime(new Date())}</div>
          </div>
        </DialogHeader>

        <div className='grid gap-4 md:grid-cols-2'>
          <Field label={c('Título', 'Title')} value={notificacion.titulo} />
          <Field label={c('Asunto', 'Subject')} value={notificacion.asunto} />
          <Field label={c('Tipo', 'Type')} value={notificationValue(locale, notificacion.tipo)} />
          <Field label={c('Canal', 'Channel')} value={notificationValue(locale, notificacion.canal)} />
          <Field label={c('Estado', 'Status')} value={notificationValue(locale, notificacion.estado)} />
          <Field label={c('Destinatarios', 'Recipients')} value={notificationValue(locale, notificacion.destinatario_segmento)} />
          <Field label={c('Programada', 'Scheduled')} value={formatFrontendDateTime(notificacion.fecha_programada)} />
          <Field label={c('Enviada', 'Sent')} value={formatFrontendDateTime(notificacion.fecha_enviada)} />
          <Field label={c('Total destinatarios', 'Total recipients')} value={notificacion.total_destinatarios} />
          <Field label={c('Total enviados', 'Total sent')} value={notificacion.total_enviados} />
          <Field label={c('Terminal', 'Terminal')} value={notificacion.mostrar_terminal ? c('Sí', 'Yes') : c('No', 'No')} />
          <Field label={c('Terminal visible', 'Terminal visible')} value={notificacion.terminal_visible ? c('Sí', 'Yes') : c('No', 'No')} />
        </div>

        <div className='rounded-xl border bg-muted/40 p-4 text-sm'>
          <div className='font-semibold'>{c('Mensaje', 'Message')}</div>
          <p className='mt-2 whitespace-pre-wrap text-muted-foreground'>{notificacion.cuerpo}</p>
        </div>

        {notificacion.envios && notificacion.envios.length > 0 ? (
          <div className='rounded-xl border p-4'>
            <div className='mb-3 font-semibold'>{c('Últimos envíos', 'Latest deliveries')}</div>
            <div className='max-h-60 overflow-auto'>
              <table className='w-full text-left text-sm'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    <th className='px-3 py-2'>{c('Socio', 'Member')}</th>
                    <th className='px-3 py-2'>{c('Email', 'Email')}</th>
                    <th className='px-3 py-2'>{c('Estado', 'Status')}</th>
                    <th className='px-3 py-2'>{c('Fecha', 'Date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {notificacion.envios.map((envio) => (
                    <tr key={envio.id} className='border-b'>
                      <td className='px-3 py-2'>{envio.nombre_destinatario ?? '-'}</td>
                      <td className='px-3 py-2'>{envio.email ?? '-'}</td>
                      <td className='px-3 py-2'>{notificationValue(locale, envio.estado)}</td>
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
              {c('Preparar/enviar a socios', 'Prepare/send to members')}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
