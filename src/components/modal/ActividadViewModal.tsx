"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Actividad } from "@/interfaces/actividad.interface";

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
      <DialogContent className="p-6 w-full max-w-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalles de Actividad
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {new Date().toLocaleString()}
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ID</label>
            <div className="p-2 bg-gray-50 rounded-md border">
              {actividad.id || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre de Actividad</label>
            <div className="p-2 bg-gray-50 rounded-md border">
              {actividad.nombre_actividad || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Creado en</label>
            <div className="p-2 bg-gray-50 rounded-md border">
              {new Date(actividad.creado_en).toLocaleString() || "-"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Actualizado en</label>
            <div className="p-2 bg-gray-50 rounded-md border">
              {new Date(actividad.actualizado_en).toLocaleString() || "-"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
