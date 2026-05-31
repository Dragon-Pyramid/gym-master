"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empleado } from "@/interfaces/empleado.interface";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { formatFrontendDate } from "@/utils/dateFormat";
import { Eye, Pencil, UserX } from "lucide-react";

export default function EmpleadoTable({
  empleados,
  loading,
  onEdit,
  onView,
  onDeactivate,
}: {
  empleados: Empleado[];
  loading?: boolean;
  onEdit: (empleado: Empleado) => void;
  onView?: (empleado: Empleado) => void;
  onDeactivate?: (empleado: Empleado) => void;
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

  if (empleados.length === 0 && !loading) {
    return <div className="py-10 text-center text-muted-foreground">No hay empleados registrados.</div>;
  }

  return (
    <Table className="w-full overflow-hidden rounded-md border border-border text-sm">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Empleado</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead>Área / puesto</TableHead>
          <TableHead>Alta</TableHead>
          <TableHead>Sueldo ref.</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {empleados.map((empleado) => (
          <TableRow key={empleado.id} className="transition-colors odd:bg-muted/40 hover:bg-[#a8d9f9]">
            <TableCell>
              <div className="font-medium">{empleado.nombre_completo}</div>
              <div className="text-xs text-muted-foreground">DNI {empleado.dni}</div>
            </TableCell>
            <TableCell>{empleado.tipo_empleado?.nombre || "Sin tipo"}</TableCell>
            <TableCell>
              <div>{empleado.email || "-"}</div>
              <div className="text-xs text-muted-foreground">{empleado.telefono || "Sin teléfono"}</div>
            </TableCell>
            <TableCell>
              <div>{empleado.area || "-"}</div>
              <div className="text-xs text-muted-foreground">{empleado.puesto || "Sin puesto"}</div>
            </TableCell>
            <TableCell>{formatFrontendDate(empleado.fecha_alta)}</TableCell>
            <TableCell>{formatCurrencyARS(empleado.sueldo_base ?? 0)}</TableCell>
            <TableCell>{empleado.activo === false ? "Inactivo" : "Activo"}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onView?.(empleado)} title="Ver">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(empleado)} title="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                {empleado.activo !== false && (
                  <Button size="sm" variant="destructive" onClick={() => onDeactivate?.(empleado)} title="Desactivar">
                    <UserX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={7}>Total de empleados</TableCell>
          <TableCell className="text-right">{empleados.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de empleados registrados.</TableCaption>
    </Table>
  );
}
