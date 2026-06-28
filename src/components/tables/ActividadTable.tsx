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
import { formatFrontendDate } from '@/utils/dateFormat';

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
    <div className="space-y-3 md:space-y-0">
      <div className="grid gap-3 md:hidden">
        {actividades.map((a, i) => (
          <article
            key={a.id || i}
            className="rounded-xl border bg-white p-3 shadow-sm"
          >
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-950">
                {a.nombre_actividad}
              </h3>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <span>Creado: {formatFrontendDate(a.creado_en)}</span>
                <span>Actualizado: {formatFrontendDate(a.actualizado_en)}</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
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
                <Pencil className="mr-1 h-4 w-4" />
                Editar
              </Button>
              <Button
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={() => onDelete && onDelete(a)}
              >
                Eliminar
              </Button>
            </div>
          </article>
        ))}

        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Total de actividades: <span className="font-semibold text-foreground">{actividades.length}</span>
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-md border md:block">
        <Table className="min-w-[720px] overflow-hidden text-sm">
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
                <TableCell>{formatFrontendDate(a.creado_en)}</TableCell>
                <TableCell>
                  {formatFrontendDate(a.actualizado_en)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
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
                  </div>
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
      </div>
    </div>
  );
}
