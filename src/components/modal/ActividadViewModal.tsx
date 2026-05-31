"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Actividad } from "@/interfaces/actividad.interface";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';

export default function ActividadViewModal({
  open,
  onClose,
  actividad,
}: {
  open: boolean;
  onClose: () => void;
  actividad?: Actividad | null;
}) {
  if (!actividad) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg p-6 sm:max-w-md bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/ActividadViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalles de Actividad
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ID</label>
            <div className="p-2 border rounded-md bg-muted text-foreground">
              {actividad.id || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre de Actividad</label>
            <div className="p-2 border rounded-md bg-muted text-foreground">
              {actividad.nombre_actividad || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Creado en</label>
            <div className="p-2 border rounded-md bg-muted text-foreground">
              {formatFrontendDateTime(actividad.creado_en) || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Actualizado en</label>
            <div className="p-2 border rounded-md bg-muted text-foreground">
              {formatFrontendDateTime(actividad.actualizado_en) || "-"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
