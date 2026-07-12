"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OtrosGastosForm from "../forms/OtrosGastosForm";
import FechaHora from "@/components/ui/FechaHora";
import { useI18n } from "@/i18n/I18nProvider";
import { translateOtrosGastosUi } from "@/utils/otrosGastosI18n";

export default function OtrosGastosModal({
  open,
  onClose,
  onCreated,
  gasto,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  gasto?: any | null;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateOtrosGastosUi(locale, text);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl dark:border-neutral-800 dark:bg-neutral-950">
        <QaFileNameBadge file="src/components/modal/OtrosGastosModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>{gasto ? c("Editar Gasto / Egreso") : c("Nuevo Gasto / Egreso")}</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <OtrosGastosForm
          gasto={gasto}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
