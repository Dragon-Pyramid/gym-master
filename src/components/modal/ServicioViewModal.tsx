"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Servicio } from "@/components/tables/ServicioTable";

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
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalle Servicio
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {new Date().toLocaleString()}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <div className="p-2 border rounded-md bg-gray-50">
                {servicio.nombre || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <div className="p-2 border rounded-md bg-gray-50">
                {servicio.descripcion || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio</label>
              <div className="p-2 border rounded-md bg-gray-50">
                ${servicio.precio}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Activo</label>
              <div className="p-2 border rounded-md bg-gray-50">
                {servicio.activo ? "Sí" : "No"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
