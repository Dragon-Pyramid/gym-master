"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import ProductoStockMovimientoForm from "@/components/forms/ProductoStockMovimientoForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Producto } from "@/interfaces/producto.interface";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

export default function ProductoStockMovimientoModal({
  open,
  onClose,
  producto,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  producto?: Producto | null;
  onSaved: () => void | Promise<void>;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[760px] !w-full bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/ProductoStockMovimientoModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {c("Movimiento de stock")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {c('Registrá ajustes, recuentos, devoluciones vendibles, mermas o reposiciones con trazabilidad.')}
          </p>
        </DialogHeader>
        <ProductoStockMovimientoForm
          producto={producto}
          onSaved={async () => {
            await onSaved();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
