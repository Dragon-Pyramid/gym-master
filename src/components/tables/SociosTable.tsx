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
import { Socio } from "@/interfaces/socio.interface";

export default function SociosTable({
  socios,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  socios: Socio[];
  loading?: boolean;
  onEdit: (socio: Socio) => void;
  onView?: (socio: Socio) => void;
  onDelete?: (socio: Socio) => void;
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

  if (socios.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay socios registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>DNI</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Fecha Alta</TableHead>
          <TableHead>Activo</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {socios.map((s, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{s.dni}</TableCell>
            <TableCell>{s.nombre_completo}</TableCell>
            <TableCell>{s.telefono}</TableCell>
            <TableCell>{s.email}</TableCell>
            <TableCell>{s.fecha_alta}</TableCell>
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
                  " text-white w-[100px]" // 👈 fuerza el ancho exacto
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
          <TableCell colSpan={6}>Total de socios</TableCell>
          <TableCell className="text-right">{socios.length}</TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>Listado de socios registrados.</TableCaption>
    </Table>
  );
}
