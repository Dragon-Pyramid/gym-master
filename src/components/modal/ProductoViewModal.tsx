"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Producto } from "@/interfaces/producto.interface";

export default function ProductoViewModal({
  open,
  onClose,
  producto,
}: {
  open: boolean;
  onClose: () => void;
  producto?: Producto | null;
}) {
  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Producto
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {new Date().toLocaleString()}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.nombre || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.descripcion || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Precio</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.precio}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.stock}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor ID</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.proveedor_id || "-"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
