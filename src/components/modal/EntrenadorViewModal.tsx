"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Entrenador } from "@/interfaces/entrenador.interface";

export default function EntrenadorViewModal({
  open,
  onClose,
  entrenador,
}: {
  open: boolean;
  onClose: () => void;
  entrenador?: Entrenador | null;
}) {
  if (!entrenador) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Entrenador
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {new Date().toLocaleString()}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {entrenador.nombre_completo || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">DNI</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {entrenador.dni || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Alta</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {entrenador.fecha_alta || "-"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Horarios de trabajo</label>
              <div className="p-2 border rounded-md bg-muted text-foreground min-h-[100px]">
                {entrenador.horarios_texto || "Sin horarios asignados"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
