"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export interface VentaDetalle {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export default function VentaDetalleTable({
  detalles,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  detalles: VentaDetalle[];
  loading?: boolean;
  onEdit: (detalle: VentaDetalle) => void;
  onView?: (detalle: VentaDetalle) => void;
  onDelete?: (detalle: VentaDetalle) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (detalles.length === 0 && !loading) {
    return (
      <div className="text-center text-muted-foreground py-10">
        No hay detalles de venta registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full text-sm border border-border rounded-md overflow-hidden">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Venta</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Precio Unitario</TableHead>
          <TableHead>Subtotal</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {detalles.map((d, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{d.venta_id}</TableCell>
            <TableCell>{d.producto_id}</TableCell>
            <TableCell>{d.cantidad}</TableCell>
            <TableCell>${d.precio_unitario}</TableCell>
            <TableCell>${d.subtotal}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(d)}
              >
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(d)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(d)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>Total de detalles</TableCell>
          <TableCell className="text-right">{detalles.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de detalles de venta registrados.</TableCaption>
    </Table>
  );
}
