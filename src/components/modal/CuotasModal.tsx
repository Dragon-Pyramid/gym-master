"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CuotasForm from "../forms/CuotasForm";
import FechaHora from "@/components/ui/FechaHora";

export default function CuotasModal({
  open,
  onClose,
  onCreated,
  cuota,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  cuota?: any | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>{cuota ? "Editar Cuota" : "Nueva Cuota"}</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <CuotasForm
          cuota={cuota}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
