"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Usuario } from "@/interfaces/usuario.interface";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";


function userViewTx(locale: GymMasterLocale, es: string, en: string) {
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

export default function UserViewModal({
  open,
  onClose,
  usuario,
}: {
  open: boolean;
  onClose: () => void;
  usuario?: Usuario | null;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => userViewTx(locale, es, en);

  if (!open || !usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg p-6 sm:max-w-md bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/UserViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {c("Detalles del Usuario", "User details")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <p className="text-foreground">
            <strong>ID:</strong> {usuario.id}
          </p>
          <p className="text-foreground">
            <strong>{c("Nombre", "Name")}:</strong> {usuario.nombre}
          </p>
          <p className="text-foreground">
            <strong>Email:</strong> {usuario.email}
          </p>
          <p className="text-foreground">
            <strong>{c("Rol", "Role")}:</strong> {translateUserRole(locale, usuario.rol)}
          </p>
          <p className="text-foreground">
            <strong>{c("Permisos", "Permissions")}:</strong>{' '}
            {usuario.rol === 'admin'
              ? c('Control total', 'Full control')
              : Array.isArray(usuario.permisos_menu)
              ? `${usuario.permisos_menu.length} ${c('módulos habilitados', 'enabled modules')}`
              : c('Permisos por defecto', 'Default permissions')}
          </p>
          <p className="text-foreground">
            <strong>{c("Estado", "Status")}:</strong>{" "}
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                usuario.activo
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {usuario.activo ? c("Activo", "Active") : c("Deshabilitado", "Disabled")}
            </span>
          </p>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>{c("Cerrar", "Close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
