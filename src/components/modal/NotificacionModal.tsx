'use client';

import NotificacionForm from '@/components/forms/NotificacionForm';
import { QaFileNameBadge } from '@/components/qa/QaFileNameBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Notificacion, NotificacionPlantilla } from '@/interfaces/notificacion.interface';
import { formatFrontendDateTime } from '@/utils/dateFormat';

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
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-full max-w-5xl'>
        <QaFileNameBadge file='src/components/modal/NotificacionModal.tsx' />
        <DialogHeader>
          <div className='flex w-full items-center justify-between gap-4'>
            <DialogTitle>{notificacion ? 'Editar notificación' : 'Nueva notificación'}</DialogTitle>
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
