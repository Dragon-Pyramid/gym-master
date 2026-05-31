"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VentaDetalle } from "@/interfaces/venta_detalle.interface";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';

export default function VentaDetalleViewModal({
  open,
  onClose,
  detalle,
}: {
  open: boolean;
  onClose: () => void;
  detalle?: VentaDetalle | null;
}) {
  if (!detalle) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full">
        <QaFileNameBadge file="src/components/modal/VentaDetalleViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalle de Venta
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Venta</label>
              <div className="p-2 border rounded-md bg-gray-50">
                {detalle.venta_id || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto</label>
              <div className="p-2 border rounded-md bg-gray-50">
                {detalle.producto_id || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <div className="p-2 border rounded-md bg-gray-50">
                {detalle.cantidad}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio Unitario</label>
              <div className="p-2 border rounded-md bg-gray-50">
                ${detalle.precio_unitario}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtotal</label>
              <div className="p-2 border rounded-md bg-gray-50">
                ${detalle.subtotal}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
