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
import { Aviso } from "@/interfaces/aviso.interface";

export default function AvisosTable({
  avisos,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  avisos: Aviso[];
  loading?: boolean;
  onEdit: (aviso: Aviso) => void;
  onView?: (aviso: Aviso) => void;
  onDelete?: (aviso: Aviso) => void;
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

  if (avisos.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay avisos registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Título</TableHead>
          <TableHead>Mensaje</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Fecha de envío</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {avisos.map((a) => (
          <TableRow
            key={a.id}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{a.titulo}</TableCell>
            <TableCell className="max-w-[220px] truncate whitespace-nowrap overflow-hidden">
              {a.mensaje}
            </TableCell>
            <TableCell>{a.tipo}</TableCell>
            <TableCell>{a.fecha_envio}</TableCell>
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
          <TableCell colSpan={4}>Total de avisos</TableCell>
          <TableCell className="text-right">{avisos.length}</TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>Listado de avisos enviados.</TableCaption>
    </Table>
  );
}
