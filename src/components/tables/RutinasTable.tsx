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

export interface Rutina {
  id_rutina: string;
  objetivo: string;
  nivel: string;
  fecha: string;
  dias: string;
  creado_en: string;
}

export default function RutinasTable({
  rutinas,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  rutinas: Rutina[];
  loading?: boolean;
  onEdit: (rutina: Rutina) => void;
  onView?: (rutina: Rutina) => void;
  onDelete?: (rutina: Rutina) => void;
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

  if (rutinas.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay rutinas registradas aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Objetivo</TableHead>
          <TableHead>Nivel</TableHead>
          <TableHead>Creado en</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Días</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rutinas.map((r, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell>{r.objetivo}</TableCell>
            <TableCell>{r.nivel}</TableCell>
            <TableCell>{r.creado_en}</TableCell>
            <TableCell>{r.fecha}</TableCell>
            <TableCell>{r.dias}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(r)}
              >
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(r)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(r)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>Total de rutinas</TableCell>
          <TableCell className="text-right">{rutinas.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de rutinas registradas.</TableCaption>
    </Table>
  );
}
