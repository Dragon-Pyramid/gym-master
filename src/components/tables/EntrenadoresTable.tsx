"use client";

import { Pencil, Eye, Trash2 } from "lucide-react";
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
import { Entrenador } from "@/interfaces/entrenador.interface";

export default function EntrenadoresTable({
  entrenadores,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  entrenadores: Entrenador[];
  loading?: boolean;
  onEdit: (entrenador: Entrenador) => void;
  onView?: (entrenador: Entrenador) => void;
  onDelete?: (entrenador: Entrenador) => void;
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

  if (entrenadores.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay entrenadores registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>DNI</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Fecha Alta</TableHead>
          <TableHead>Horarios</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {entrenadores.map((e, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{e.dni}</TableCell>
            <TableCell>{e.nombre_completo}</TableCell>
            <TableCell>{e.fecha_alta}</TableCell>
            <TableCell className="max-w-xs truncate">
              {e.horarios_texto}
            </TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(e)}
                title="Ver"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(e)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete && onDelete(e)}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total de entrenadores</TableCell>
          <TableCell className="text-right">{entrenadores.length}</TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>Listado de entrenadores registrados.</TableCaption>
    </Table>
  );
}
