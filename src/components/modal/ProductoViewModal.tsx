"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Producto, ProductoPrecioCostoHistorial } from "@/interfaces/producto.interface";
import {
  formatCurrencyARS,
  getProductoStockEstadoLabel,
  getProductoStockMinimo,
} from "@/lib/comercial/productos";
import { getProductoHistorialPreciosCostos } from "@/services/productoService";

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
  const [historial, setHistorial] = useState<ProductoPrecioCostoHistorial[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadHistorial() {
      if (!producto?.id || !open) {
        setHistorial([]);
        return;
      }

      try {
        const data = await getProductoHistorialPreciosCostos(producto.id);
        if (mounted) setHistorial(data);
      } catch {
        if (mounted) setHistorial([]);
      }
    }

    loadHistorial();

    return () => {
      mounted = false;
    };
  }, [producto?.id, open]);

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
              <label className="text-sm font-medium">Costo de compra</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {formatCurrencyARS(producto.costo ?? 0)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Margen estimado</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {formatCurrencyARS((producto.precio ?? 0) - (producto.costo ?? 0))}
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
        <div className="mt-6 rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Historial de precios y costos</h3>
            <span className="text-xs text-muted-foreground">{historial.length} registros</span>
          </div>
          {historial.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay historial registrado todavía.</p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-md border bg-background">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-right">Precio anterior</th>
                    <th className="px-3 py-2 text-right">Precio nuevo</th>
                    <th className="px-3 py-2 text-right">Costo anterior</th>
                    <th className="px-3 py-2 text-right">Costo nuevo</th>
                    <th className="px-3 py-2 text-right">Margen</th>
                    <th className="px-3 py-2 text-left">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">
                        {item.fecha_vigencia || item.creado_en?.slice(0, 10) || "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.precio_anterior == null ? "-" : formatCurrencyARS(item.precio_anterior)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrencyARS(item.precio_nuevo)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.costo_anterior == null ? "-" : formatCurrencyARS(item.costo_anterior)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrencyARS(item.costo_nuevo)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrencyARS(item.margen_nuevo ?? 0)}
                        {item.margen_porcentaje_nuevo != null
                          ? ` (${Number(item.margen_porcentaje_nuevo).toFixed(1)}%)`
                          : ""}
                      </td>
                      <td className="max-w-[220px] px-3 py-2">
                        {item.motivo || item.origen || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
