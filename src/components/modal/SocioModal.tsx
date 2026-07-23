"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SocioForm from "../forms/SocioForm";
import FechaHora from "@/components/ui/FechaHora";
import { useI18n } from "@/i18n/I18nProvider";

export default function SocioModal({
  open,
  onClose,
  onCreated,
  socio,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  socio?: any | null;
}) {
  const { locale } = useI18n();
  const tx = (es: string, en: string) => (locale === "en" ? en : es);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/SocioModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {socio ? tx("Editar socio", "Edit member") : tx("Nuevo socio", "New member")}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <SocioForm
          socio={socio}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
