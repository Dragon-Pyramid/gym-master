"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VentaDetalleForm from "../forms/VentaDetalleForm";
import FechaHora from "@/components/ui/FechaHora";

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
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {detalle ? "Editar Detalle" : "Nuevo Detalle"}
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
