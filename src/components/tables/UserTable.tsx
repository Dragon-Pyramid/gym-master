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
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";


function usersTableTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function translateUserRole(locale: GymMasterLocale, role?: string | null) {
  if (locale !== "en") return role || "-";
  const normalized = String(role || "").toLowerCase();
  if (normalized === "socio") return "Member";
  if (normalized === "usuario") return "Internal user";
  if (normalized === "admin") return "Admin";
  return role || "-";
}

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
  const { locale } = useI18n();
  const c = (es: string, en: string) => usersTableTx(locale, es, en);

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
        {c("No hay usuarios registrados aún.", "There are no registered users yet.")}
      </div>
    );
  }

  return (
    <Table className="overflow-hidden w-full text-sm rounded-md border border-border dark:border-slate-800">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground dark:bg-slate-900/70">
          <TableHead>{c("Nombre", "Name")}</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>{c("Rol", "Role")}</TableHead>
          <TableHead>{c("Activo", "Active")}</TableHead>
          <TableHead>{c("Permisos", "Permissions")}</TableHead>
          <TableHead>{c("Acciones", "Actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios.map((u, i) => (
          <TableRow
            key={i}
            className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors dark:odd:bg-slate-900/40 dark:hover:bg-slate-800"
          >
            <TableCell className="font-medium">{u.nombre}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell>{translateUserRole(locale, u.rol)}</TableCell>
            <TableCell>{u.activo ? "✅" : "❌"}</TableCell>
            <TableCell>
              {u.rol === 'admin'
                ? c('Total', 'Full')
                : Array.isArray(u.permisos_menu)
                ? `${u.permisos_menu.length} ${c('módulos', 'modules')}`
                : c('Por defecto', 'Default')}
            </TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(u)}
              >
                {c("Ver", "View")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(u)}
                title={c("Editar", "Edit")}
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
                {u.activo ? c("Desactivar", "Deactivate") : c("Activar", "Activate")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5}>{c("Total de usuarios", "Total users")}</TableCell>
          <TableCell className="text-right">{usuarios.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>{c("Listado de usuarios registrados.", "List of registered users.")}</TableCaption>
    </Table>
  );
}
