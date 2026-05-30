"use client";

import { Pencil } from "lucide-react";
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

function StockBadge({ producto }: { producto: Producto }) {
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
      {label}
    </span>
  );
}

export default function ProductoTable({
  productos,
  loading,
  onEdit,
  onView,
  onDelete,
  getProveedorNombre,
}: {
  productos: Producto[];
  loading?: boolean;
  onEdit: (producto: Producto) => void;
  onView?: (producto: Producto) => void;
  onDelete?: (producto: Producto) => void;
  getProveedorNombre?: (proveedorId?: string | null) => string;
}) {
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
        No hay productos registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Producto</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Costo</TableHead>
          <TableHead>Margen</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Acciones</TableHead>
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
                <p className="font-medium">{p.nombre}</p>
                <p className="max-w-[320px] truncate text-xs text-muted-foreground">
                  {p.descripcion || "Sin descripción"}
                </p>
              </div>
            </TableCell>
            <TableCell>{formatCurrencyARS(p.precio)}</TableCell>
            <TableCell>{formatCurrencyARS(p.costo ?? 0)}</TableCell>
            <TableCell>{formatCurrencyARS((p.precio ?? 0) - (p.costo ?? 0))}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <p className="font-semibold">{p.stock}</p>
                <p className="text-xs text-muted-foreground">
                  mínimo operativo: {getProductoStockMinimo(p)}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <StockBadge producto={p} />
            </TableCell>
            <TableCell>{getProveedorNombre?.(p.proveedor_id) ?? p.proveedor_id ?? "Sin proveedor asignado"}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(p)}
              >
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(p)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[110px]"
                onClick={() => onDelete && onDelete(p)}
              >
                Desactivar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={7}>Total de productos</TableCell>
          <TableCell className="text-right">{productos.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de productos registrados.</TableCaption>
    </Table>
  );
}
