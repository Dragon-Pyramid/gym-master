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

export interface OtrosGastos {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
}

export default function OtrosGastosTable({
  gastos,
  loading,
  onEdit,
  onDelete,
}: {
  gastos: OtrosGastos[];
  loading?: boolean;
  onEdit: (gasto: OtrosGastos) => void;
  onDelete?: (gasto: OtrosGastos) => void;
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

  if (gastos.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay gastos registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Descripción</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gastos.map((g, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{g.descripcion}</TableCell>
            <TableCell>${g.monto}</TableCell>
            <TableCell>{g.fecha}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(g)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(g)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total de gastos</TableCell>
          <TableCell className="text-right" colSpan={2}>
            {gastos.length}
          </TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de otros gastos registrados.</TableCaption>
    </Table>
  );
}
