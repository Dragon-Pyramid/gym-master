"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OtrosGastosForm from "../forms/OtrosGastosForm";
import FechaHora from "@/components/ui/FechaHora";

export default function OtrosGastosModal({
  open,
  onClose,
  onCreated,
  gasto,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  gasto?: any | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>{gasto ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <OtrosGastosForm
          gasto={gasto}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
