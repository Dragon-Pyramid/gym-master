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
import { Proveedor, ProveedorEstado } from "@/interfaces/proveedor.interface";

const estadoLabel: Record<ProveedorEstado, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  discontinuado: "Discontinuado",
};

const estadoClassName = (estado?: ProveedorEstado | null) => {
  if (estado === "inactivo") return "bg-gray-100 text-gray-700 border-gray-200";
  if (estado === "discontinuado") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

export default function ProveedoresTable({
  proveedores,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  proveedores: Proveedor[];
  loading?: boolean;
  onEdit: (proveedor: Proveedor) => void;
  onView?: (proveedor: Proveedor) => void;
  onDelete?: (proveedor: Proveedor) => void | Promise<void>;
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

  if (proveedores.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay proveedores registrados aún.
      </div>
    );
  }

  return (
    <Table className="overflow-hidden w-full text-sm rounded-md border border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Proveedor</TableHead>
          <TableHead>Fiscal</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead>Ubicación</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {proveedores.map((p, i) => {
          const estado = p.estado ?? "activo";
          return (
            <TableRow
              key={p.id || i}
              className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
            >
              <TableCell className="min-w-[220px]">
                <div className="font-medium">{p.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {p.razon_social || p.rubro || "Sin razón social/rubro"}
                </div>
              </TableCell>
              <TableCell className="min-w-[170px]">
                <div>{p.identificacion_fiscal || "-"}</div>
                <div className="text-xs text-muted-foreground">
                  {p.condicion_fiscal || "Sin condición fiscal"}
                </div>
              </TableCell>
              <TableCell className="min-w-[190px]">
                <div>{p.contacto || "-"}</div>
                <div className="text-xs text-muted-foreground">
                  {p.email || p.whatsapp || p.telefono || "Sin contacto"}
                </div>
              </TableCell>
              <TableCell className="min-w-[180px]">
                <div>{p.ciudad || p.provincia || p.pais || "-"}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {p.direccion || "Sin dirección"}
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${estadoClassName(estado)}`}>
                  {estadoLabel[estado] ?? "Activo"}
                </span>
              </TableCell>
              <TableCell className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView && onView(p)}
                >
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(p)}
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white w-[110px]"
                  onClick={() => onDelete && onDelete(p)}
                  disabled={estado === "inactivo"}
                >
                  {estado === "inactivo" ? "Inactivo" : "Desactivar"}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>Total de proveedores</TableCell>
          <TableCell className="text-right">{proveedores.length}</TableCell>
        </TableRow>
      </TableFooter>

      <TableCaption>Listado de proveedores registrados.</TableCaption>
    </Table>
  );
}
