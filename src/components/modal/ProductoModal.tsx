"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductoForm from "../forms/ProductoForm";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

export default function ProductoModal({
  open,
  onClose,
  onCreated,
  producto,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  producto?: any | null;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/ProductoModal.tsx" />
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>
              {producto ? c("Editar Producto") : c("Nuevo Producto")}
            </DialogTitle>
          </div>
        </DialogHeader>
        <ProductoForm
          producto={producto}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
