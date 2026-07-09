"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProveedorForm from "../forms/ProveedorForm";
import FechaHora from "@/components/ui/FechaHora";
import { Proveedor } from "@/interfaces/proveedor.interface";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

export default function ProveedorModal({
  open,
  onClose,
  onCreated,
  proveedor,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  proveedor?: Proveedor | null;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/ProveedorModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {proveedor ? c("Editar Proveedor") : c("Nuevo Proveedor")}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <ProveedorForm
          proveedor={proveedor}
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
