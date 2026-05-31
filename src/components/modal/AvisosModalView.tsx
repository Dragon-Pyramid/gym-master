"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Aviso } from "@/interfaces/aviso.interface";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';

export default function AvisosModalView({
  open,
  onClose,
  aviso,
}: {
  open: boolean;
  onClose: () => void;
  aviso?: Aviso | null;
}) {
  if (!aviso) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/AvisosModalView.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Aviso
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asunto</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {aviso.titulo || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de envío</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {aviso.fecha_envio || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Mensaje</label>
            <div className="p-2 break-words whitespace-pre-line border rounded-md bg-muted text-foreground">
              {aviso.mensaje || "-"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
