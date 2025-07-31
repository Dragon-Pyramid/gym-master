"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Socio } from "@/interfaces/socio.interface";

export default function SocioViewModal({
  open,
  onClose,
  socio,
}: {
  open: boolean;
  onClose: () => void;
  socio?: Socio | null;
}) {
  if (!socio) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Socio
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {new Date().toLocaleString()}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          {/* Columna izquierda */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {socio.nombre_completo || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">DNI</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {socio.dni || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {socio.direccion || "-"}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {socio.telefono || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {socio.email || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Alta</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {socio.fecha_alta || "-"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
