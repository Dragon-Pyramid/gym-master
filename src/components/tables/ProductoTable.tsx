"use client";

import { ClipboardList, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Producto } from "@/interfaces/producto.interface";
import {
  formatCurrencyARS,
  getProductoStockEstado,
  getProductoStockEstadoLabel,
  getProductoStockMinimo,
} from "@/lib/comercial/productos";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

function StockBadge({ producto }: { producto: Producto }) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const estado = getProductoStockEstado(producto);
  const label = getProductoStockEstadoLabel(producto);

  const className =
    estado === "sin_stock"
      ? "bg-red-100 text-red-700 border-red-200"
      : estado === "stock_critico"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : estado === "inactivo"
      ? "bg-slate-100 text-slate-600 border-slate-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${className}`}>
      {c(label)}
    </span>
  );
}

export default function ProductoTable({
  productos,
  loading,
  onEdit,
  onView,
  onDelete,
  onStockMovement,
  getProveedorNombre,
}: {
  productos: Producto[];
  loading?: boolean;
  onEdit: (producto: Producto) => void;
  onView?: (producto: Producto) => void;
  onDelete?: (producto: Producto) => void;
  onStockMovement?: (producto: Producto) => void;
  getProveedorNombre?: (proveedorId?: string | null) => string;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (productos.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {c("No hay productos registrados aún.")}
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>{c("Producto")}</TableHead>
          <TableHead>{c("Códigos")}</TableHead>
          <TableHead>{c("Precio")}</TableHead>
          <TableHead>{c("Costo")}</TableHead>
          <TableHead>{c("Margen")}</TableHead>
          <TableHead>{c("Stock")}</TableHead>
          <TableHead>{c("Estado")}</TableHead>
          <TableHead>{c("Proveedor")}</TableHead>
          <TableHead>{c("Acciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {productos.map((p) => (
          <TableRow
            key={p.id}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell>
              <div className="space-y-1">
                <p className="font-medium">{c(p.nombre)}</p>
                <p className="max-w-[320px] truncate text-xs text-muted-foreground">
                  {p.descripcion ? c(p.descripcion) : c("Sin descripción")}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1 text-xs">
                <p><span className="text-muted-foreground">{c("SKU")}:</span> {p.sku || "-"}</p>
                <p><span className="text-muted-foreground">{c("Barra")}:</span> {p.codigo_barras || "-"}</p>
              </div>
            </TableCell>
            <TableCell>{formatCurrencyARS(p.precio)}</TableCell>
            <TableCell>{formatCurrencyARS(p.costo ?? 0)}</TableCell>
            <TableCell>{formatCurrencyARS((p.precio ?? 0) - (p.costo ?? 0))}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <p className="font-semibold">{p.stock}</p>
                <p className="text-xs text-muted-foreground">
                  {c("mínimo operativo")}: {getProductoStockMinimo(p)}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <StockBadge producto={p} />
            </TableCell>
            <TableCell>{getProveedorNombre?.(p.proveedor_id) ?? p.proveedor_id ?? c("Sin proveedor asignado")}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(p)}
              >
                {c("Ver")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStockMovement && onStockMovement(p)}
                title={c("Movimiento de stock")}
              >
                <ClipboardList className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(p)}
                title={c("Editar")}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[110px]"
                onClick={() => onDelete && onDelete(p)}
              >
                {c("Desactivar")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={8}>{c("Total de productos")}</TableCell>
          <TableCell className="text-right">{productos.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>{c("Listado de productos registrados.")}</TableCaption>
    </Table>
  );
}
