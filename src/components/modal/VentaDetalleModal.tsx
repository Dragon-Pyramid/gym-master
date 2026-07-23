"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VentaDetalleForm from "../forms/VentaDetalleForm";
import FechaHora from "@/components/ui/FechaHora";
import { useI18n } from "@/i18n/I18nProvider";
import { translateCommercialUi } from "@/i18n/commercialUi";

export default function VentaDetalleModal({
  open,
  onClose,
  onCreated,
  detalle,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  detalle?: any | null;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/VentaDetalleModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {detalle ? c("Editar Detalle") : c("Nuevo Detalle")}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <VentaDetalleForm
          detalle={detalle}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
