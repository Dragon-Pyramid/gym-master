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

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
}

export default function ServicioTable({
  servicios,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  servicios: Servicio[];
  loading?: boolean;
  onEdit: (servicio: Servicio) => void;
  onView?: (servicio: Servicio) => void;
  onDelete?: (servicio: Servicio) => void;
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

  if (servicios.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay servicios registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Nombre</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Activo</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servicios.map((s, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{s.nombre}</TableCell>
            <TableCell>{s.descripcion}</TableCell>
            <TableCell>${s.precio}</TableCell>
            <TableCell>{s.activo ? "✅" : "❌"}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(s)}
              >
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(s)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className={
                  (s.activo
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600") +
                  " text-white w-[100px]"
                }
                onClick={() => onDelete && onDelete(s)}
              >
                {s.activo ? "Desactivar" : "Activar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total de servicios</TableCell>
          <TableCell className="text-right">{servicios.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de servicios registrados.</TableCaption>
    </Table>
  );
}
