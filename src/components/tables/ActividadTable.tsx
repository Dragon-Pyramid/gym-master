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
import { Actividad } from "@/interfaces/actividad.interface";

export default function ActividadTable({
  actividades,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  actividades: Actividad[];
  loading?: boolean;
  onEdit: (actividad: Actividad) => void;
  onView?: (actividad: Actividad) => void;
  onDelete?: (actividad: Actividad) => void | Promise<void>;
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

  if (actividades.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay actividades registradas aún.
      </div>
    );
  }

  return (
    <Table className="overflow-hidden w-full text-sm rounded-md border border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Nombre Actividad</TableHead>
          <TableHead>Creado En</TableHead>
          <TableHead>Actualizado En</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {actividades.map((a, i) => (
          <TableRow
            key={a.id || i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{a.nombre_actividad}</TableCell>
            <TableCell>{new Date(a.creado_en).toLocaleDateString()}</TableCell>
            <TableCell>
              {new Date(a.actualizado_en).toLocaleDateString()}
            </TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(a)}
              >
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(a)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(a)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total de actividades</TableCell>
          <TableCell className="text-right">{actividades.length}</TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>Listado de actividades registradas.</TableCaption>
    </Table>
  );
}
