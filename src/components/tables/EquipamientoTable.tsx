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
import { Equipamento } from "@/interfaces/equipamiento.interface";

const estadoColor = {
  operativo: "bg-green-500",
  "en mantenimiento": "bg-yellow-400",
  "fuera de servicio": "bg-red-500",
};

export default function EquipamientoTable({
  equipos,
  onEdit,
  onView,
  onDelete,
}: {
  equipos: Equipamento[];
  onEdit: (equipo: Equipamento) => void;
  onView?: (equipo: Equipamento) => void;
  onDelete?: (equipo: Equipamento) => void;
}) {
  if (!equipos) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (equipos.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay equipos registrados aún.
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Ubicación</TableHead>
          <TableHead>Próxima Revisión</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {equipos.map((e) => (
          <TableRow
            key={e.id}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell>{e.nombre}</TableCell>
            <TableCell>{e.tipo}</TableCell>
            <TableCell>
              <span
                className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${
                  estadoColor[e.estado] || "bg-gray-300"
                }`}
              ></span>
              {e.estado}
            </TableCell>
            <TableCell>{e.ubicacion}</TableCell>
            <TableCell>{e.proxima_revision}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(e)}
              >
                Ver
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
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(e)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>Total de equipos</TableCell>
          <TableCell className="text-right">{equipos.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de equipos registrados.</TableCaption>
    </Table>
  );
}
