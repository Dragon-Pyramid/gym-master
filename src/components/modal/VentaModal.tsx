"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VentaForm from "../forms/VentaForm";
import FechaHora from "@/components/ui/FechaHora";

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
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>{venta ? "Editar Venta" : "Nueva Venta"}</DialogTitle>
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
