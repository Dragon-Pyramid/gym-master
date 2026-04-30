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
import { Cuota } from "@/interfaces/cuota.interface";
import { useAuthStore } from "@/stores/authStore";

export default function CuotaTable({
  cuotas,
  loading,
  onEdit,
  onView,
  onDelete,
  onToggleActivo,
}: {
  cuotas: Cuota[];
  loading?: boolean;
  onEdit: (cuota: Cuota) => void;
  onView?: (cuota: Cuota) => void;
  onDelete?: (cuota: Cuota) => void;
  onToggleActivo?: (cuota: Cuota) => void;
}) {
  const { user } = useAuthStore();
  const userRole = user?.rol;
  const isAdminOnly = userRole === "admin";

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (cuotas.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay cuotas registradas aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Descripción</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Período</TableHead>
          <TableHead>Fecha Inicio</TableHead>
          <TableHead>Fecha Fin</TableHead>
          <TableHead>Activo</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cuotas.map((c, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{c.descripcion}</TableCell>
            <TableCell>${c.monto}</TableCell>
            <TableCell>{c.periodo}</TableCell>
            <TableCell>{c.fecha_inicio}</TableCell>
            <TableCell>{c.fecha_fin}</TableCell>
            <TableCell>{c.activo ? "✅" : "❌"}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(c)}
              >
                Ver
              </Button>
              {isAdminOnly && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(c)}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className={
                      (c.activo
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600") +
                      " text-white w-[100px]"
                    }
                    onClick={() => onToggleActivo && onToggleActivo(c)}
                  >
                    {c.activo ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                    onClick={() => onDelete && onDelete(c)}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>Total de cuotas</TableCell>
          <TableCell className="text-right">{cuotas.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de cuotas registradas.</TableCaption>
    </Table>
  );
}
