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
import { Proveedor } from "@/interfaces/proveedor.interface";

export default function ProveedoresTable({
  proveedores,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  proveedores: Proveedor[];
  loading?: boolean;
  onEdit: (proveedor: Proveedor) => void;
  onView?: (proveedor: Proveedor) => void;
  onDelete?: (proveedor: Proveedor) => void | Promise<void>;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full h-9 rounded-md" />
        ))}
      </div>
    );
  }

  if (proveedores.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay proveedores registrados aún.
      </div>
    );
  }

  return (
    <Table className="overflow-hidden w-full text-sm rounded-md border border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Nombre</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {proveedores.map((p, i) => (
          <TableRow
            key={p.id || i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{p.nombre}</TableCell>
            <TableCell>{p.contacto}</TableCell>
            <TableCell>{p.telefono}</TableCell>
            <TableCell>{p.direccion}</TableCell>
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
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(p)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total de proveedores</TableCell>
          <TableCell className="text-right">{proveedores.length}</TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>Listado de proveedores registrados.</TableCaption>
    </Table>
  );
}
