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
import { ProductoStockMovimiento } from "@/interfaces/producto_stock_movimiento.interface";
import {
  formatCurrencyARS,
  getProductoStockEstadoLabel,
  getProductoStockMinimo,
} from "@/lib/comercial/productos";
import { getProductoHistorialPreciosCostos } from "@/services/productoService";
import { getProductoStockMovimientos } from "@/services/productoStockMovimientoService";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

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
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const dateLocale = locale === "en" ? "en-US" : "es-AR";
  const [historial, setHistorial] = useState<ProductoPrecioCostoHistorial[]>([]);
  const [movimientosStock, setMovimientosStock] = useState<ProductoStockMovimiento[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadHistorial() {
      if (!producto?.id || !open) {
        setHistorial([]);
        setMovimientosStock([]);
        return;
      }

      try {
        const [historialData, movimientosData] = await Promise.all([
          getProductoHistorialPreciosCostos(producto.id),
          getProductoStockMovimientos(producto.id, 20).catch(() => []),
        ]);
        if (mounted) {
          setHistorial(historialData);
          setMovimientosStock(movimientosData);
        }
      } catch {
        if (mounted) {
          setHistorial([]);
          setMovimientosStock([]);
        }
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
            {c("Detalle de producto")}
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date(), dateLocale)}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Nombre")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.nombre || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Descripción")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.descripcion || "-"}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">{c("SKU / código interno")}</p>
                <p className="font-mono font-semibold">{producto.sku || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c("Código de barras")}</p>
                <p className="font-mono font-semibold">{producto.codigo_barras || "-"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Precio de venta")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {formatCurrencyARS(producto.precio, locale)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Categoría")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {getCategoriaNombre?.(producto.id_categoria_producto) ?? producto.id_categoria_producto ?? c("Sin categoría")}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Stock actual")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {producto.stock}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Costo de compra")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {formatCurrencyARS(producto.costo ?? 0, locale)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Margen estimado")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {formatCurrencyARS((producto.precio ?? 0) - (producto.costo ?? 0), locale)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Stock mínimo operativo")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {getProductoStockMinimo(producto)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Estado comercial")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {c(getProductoStockEstadoLabel(producto))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Proveedor")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {getProveedorNombre?.(producto.proveedor_id) ?? producto.proveedor_id ?? c("Sin proveedor asignado")}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{c("Historial de precios y costos")}</h3>
            <span className="text-xs text-muted-foreground">{historial.length} {c("registros")}</span>
          </div>
          {historial.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c("No hay historial registrado todavía.")}</p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-md border bg-background">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">{c("Fecha")}</th>
                    <th className="px-3 py-2 text-right">{c("Precio anterior")}</th>
                    <th className="px-3 py-2 text-right">{c("Precio nuevo")}</th>
                    <th className="px-3 py-2 text-right">{c("Costo anterior")}</th>
                    <th className="px-3 py-2 text-right">{c("Costo nuevo")}</th>
                    <th className="px-3 py-2 text-right">{c("Margen")}</th>
                    <th className="px-3 py-2 text-left">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">
                        {formatFrontendDate(item.fecha_vigencia ?? item.creado_en, dateLocale)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.precio_anterior == null ? "-" : formatCurrencyARS(item.precio_anterior, locale)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrencyARS(item.precio_nuevo, locale)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.costo_anterior == null ? "-" : formatCurrencyARS(item.costo_anterior, locale)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrencyARS(item.costo_nuevo, locale)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrencyARS(item.margen_nuevo ?? 0, locale)}
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

        <div className="mt-6 rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{c("Movimientos de stock")}</h3>
            <span className="text-xs text-muted-foreground">{movimientosStock.length} {c("registros recientes")}</span>
          </div>
          {movimientosStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c("No hay movimientos de stock registrados todavía.")}</p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-md border bg-background">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">{c("Fecha")}</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-right">{c("Cantidad")}</th>
                    <th className="px-3 py-2 text-right">{c("Stock anterior")}</th>
                    <th className="px-3 py-2 text-right">{c("Stock nuevo")}</th>
                    <th className="px-3 py-2 text-left">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosStock.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">{formatFrontendDate(item.creado_en, dateLocale)}</td>
                      <td className="px-3 py-2 capitalize">{item.tipo.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-right font-medium">{item.cantidad}</td>
                      <td className="px-3 py-2 text-right">{item.stock_anterior}</td>
                      <td className="px-3 py-2 text-right font-medium">{item.stock_nuevo}</td>
                      <td className="max-w-[260px] px-3 py-2">{item.motivo || "-"}</td>
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
