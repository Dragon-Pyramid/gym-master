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
import { Usuario } from "@/interfaces/usuario.interface";

export default function UsersTable({
  usuarios,
  loading,
  onEdit,
  onView,
  onDelete,
}: {
  usuarios: Usuario[];
  loading?: boolean;
  onEdit: (usuario: Usuario) => void;
  onView?: (usuario: Usuario) => void;
  onDelete?: (usuario: Usuario) => void | Promise<void>;
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

  if (usuarios.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        No hay usuarios registrados aún.
      </div>
    );
  }

  return (
    <Table className="overflow-hidden w-full text-sm rounded-md border border-border">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground">
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Activo</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios.map((u, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
          >
            <TableCell className="font-medium">{u.nombre}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell>{u.rol}</TableCell>
            <TableCell>{u.activo ? "✅" : "❌"}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(u)}
              >
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(u)}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className={
                  (u.activo
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600") +
                  " text-white w-[100px]"
                }
                onClick={() => onDelete && onDelete(u)}
              >
                {u.activo ? "Desactivar" : "Activar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total de usuarios</TableCell>
          <TableCell className="text-right">{usuarios.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>Listado de usuarios registrados.</TableCaption>
    </Table>
  );
}
