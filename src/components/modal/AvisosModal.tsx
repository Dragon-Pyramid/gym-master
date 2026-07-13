"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AvisosForm from "../forms/AvisosForm";
import { useI18n } from "@/i18n/I18nProvider";

export default function AvisosModal({
  open,
  onClose,
  onCreated,
  aviso,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  aviso?: any | null;
}) {
  const { locale } = useI18n();
  const c = (es: string, en: string) => (locale === "en" ? en : es);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl border-slate-200 bg-white text-slate-950 sm:max-w-4xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50">
        <QaFileNameBadge file="src/components/modal/AvisosModal.tsx" />
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>{aviso ? c("Editar aviso", "Edit notice") : c("Nuevo aviso", "New notice")}</DialogTitle>
          </div>
        </DialogHeader>
        <AvisosForm onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  );
}
