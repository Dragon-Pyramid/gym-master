'use client';

import NotificacionForm from '@/components/forms/NotificacionForm';
import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Notificacion, NotificacionPlantilla } from '@/interfaces/notificacion.interface';
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';


function notificationTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

export default function NotificacionModal({
  open,
  onClose,
  onCreated,
  notificacion,
  plantillas,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  notificacion?: Notificacion | null;
  plantillas: NotificacionPlantilla[];
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => notificationTx(locale, es, en);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-full max-w-5xl'>
        <QaFileNameBadge file='src/components/modal/NotificacionModal.tsx' />
        <DialogHeader>
          <div className='flex w-full items-center justify-between gap-4'>
            <DialogTitle>{notificacion ? c('Editar notificación', 'Edit notification') : c('Nueva notificación', 'New notification')}</DialogTitle>
            <div className='text-sm text-muted-foreground'>{formatFrontendDateTime(new Date())}</div>
          </div>
        </DialogHeader>
        <NotificacionForm
          notificacion={notificacion}
          plantillas={plantillas}
          onCreated={() => {
            onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
