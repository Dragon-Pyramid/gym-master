"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PagoForm from "../forms/PagoForm";
import FechaHora from "@/components/ui/FechaHora";
import { useI18n } from "@/i18n/I18nProvider";

export default function PagoModal({
  open,
  onClose,
  onCreated,
  pago,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  pago?: any | null;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-white">
        <QaFileNameBadge file="src/components/modal/PagoModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {pago
                ? tx("Editar pago", "Edit payment")
                : tx("Nuevo pago", "New payment")}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <PagoForm
          pago={pago}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
