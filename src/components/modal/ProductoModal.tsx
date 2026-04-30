"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductoForm from "../forms/ProductoForm";

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
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>
              {producto ? "Editar Producto" : "Nuevo Producto"}
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
