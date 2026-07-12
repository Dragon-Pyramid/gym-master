"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CuotasForm from "../forms/CuotasForm";
import FechaHora from "@/components/ui/FechaHora";
import { useI18n } from "@/i18n/I18nProvider";

export default function CuotasModal({
  open,
  onClose,
  onCreated,
  cuota,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  cuota?: any | null;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
        <QaFileNameBadge file="src/components/modal/CuotasModal.tsx" />
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>{cuota ? tx("Editar Cuota", "Edit fee") : tx("Nueva Cuota", "New fee")}</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <CuotasForm
          cuota={cuota}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
