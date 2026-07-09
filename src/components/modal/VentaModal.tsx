"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VentaForm from "../forms/VentaForm";
import FechaHora from "@/components/ui/FechaHora";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

export default function VentaModal({
  open,
  onClose,
  onCreated,
  venta,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  venta?: any | null;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-6xl overflow-y-auto sm:max-w-5xl">
        <QaFileNameBadge file="src/components/modal/VentaModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>{venta ? c("Editar Venta") : c("Nueva Venta de Kiosco")}</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <VentaForm
          venta={venta}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
