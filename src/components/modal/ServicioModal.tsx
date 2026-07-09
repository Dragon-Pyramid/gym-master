"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ServicioForm from "../forms/ServicioForm";
import FechaHora from "@/components/ui/FechaHora";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

export default function ServicioModal({
  open,
  onClose,
  onCreated,
  servicio,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  servicio?: any | null;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/ServicioModal.tsx" />
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>
              {servicio ? c("Editar Servicio") : c("Nuevo Servicio")}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <ServicioForm
          servicio={servicio}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
