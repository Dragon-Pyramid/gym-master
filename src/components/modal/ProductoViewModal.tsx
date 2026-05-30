"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Producto } from "@/interfaces/producto.interface";
import {
  formatCurrencyARS,
  getProductoStockEstadoLabel,
  getProductoStockMinimo,
} from "@/lib/comercial/productos";

export default function ProductoViewModal({
  open,
  onClose,
  producto,
  getProveedorNombre,
  getCategoriaNombre,
}: {
  open: boolean;
  onClose: () => void;
  producto?: Producto | null;
  getProveedorNombre?: (proveedorId?: string | null) => string;
  getCategoriaNombre?: (categoriaId?: string | null) => string;
}) {
  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/ProductoViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle de producto
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
              <label className="text-sm font-medium">Precio de venta</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {formatCurrencyARS(producto.precio)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {getCategoriaNombre?.(producto.id_categoria_producto) ?? producto.id_categoria_producto ?? "Sin categoría"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock actual</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.stock}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock mínimo operativo</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {getProductoStockMinimo(producto)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado comercial</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {getProductoStockEstadoLabel(producto)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {getProveedorNombre?.(producto.proveedor_id) ?? producto.proveedor_id ?? "Sin proveedor asignado"}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
