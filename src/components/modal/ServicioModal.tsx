"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ServicioForm from "../forms/ServicioForm";
import FechaHora from "@/components/ui/FechaHora";

export default function ServicioModal({
  open,
  onClose,
  onCreated,
  servicio,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  servicio?: any | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>
              {servicio ? "Editar Servicio" : "Nuevo Servicio"}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <ServicioForm
          servicio={servicio}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
