"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Venta } from "@/interfaces/venta.interface";

export default function VentaViewModal({
  open,
  onClose,
  venta,
}: {
  open: boolean;
  onClose: () => void;
  venta?: Venta | null;
}) {
  if (!venta) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Venta
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
                {venta.socio?.nombre_completo || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {venta.fecha || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Total</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                ${venta.total}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
