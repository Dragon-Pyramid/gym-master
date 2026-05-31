"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Servicio } from "@/interfaces/servicio.interface";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';

export default function ServicioViewModal({
  open,
  onClose,
  servicio,
}: {
  open: boolean;
  onClose: () => void;
  servicio?: Servicio | null;
}) {
  if (!servicio) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/ServicioViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Servicio
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {servicio.nombre || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {servicio.descripcion || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                ${servicio.precio}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Activo</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {servicio.activo ? "Sí" : "No"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
