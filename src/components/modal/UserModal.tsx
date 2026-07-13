"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserForm from "../forms/UserForm";
import FechaHora from "@/components/ui/FechaHora";
import { Usuario } from "@/interfaces/usuario.interface";
import { useI18n } from "@/i18n/I18nProvider";

export default function UserModal({
  open,
  onClose,
  onCreated,
  usuario,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  usuario?: Usuario | null;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => (locale === "en" ? en : es);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <QaFileNameBadge file="src/components/modal/UserModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {usuario ? c("Editar Usuario", "Edit User") : c("Nuevo Usuario", "New User")}{" "}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <UserForm
          usuario={usuario}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
