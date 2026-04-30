"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pago } from "@/interfaces/pago.interface";

export default function PagoViewModal({
  open,
  onClose,
  pago,
}: {
  open: boolean;
  onClose: () => void;
  pago?: Pago | null;
}) {
  if (!pago) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Pago
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {new Date().toLocaleString()}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Socio</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {pago.socio_id || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cuota</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {pago.cuota_id || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Pago</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {pago.fecha_pago || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto Pagado</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                ${pago.monto_pagado}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registrado Por</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {pago.registrado_por || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                ${pago.total}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
