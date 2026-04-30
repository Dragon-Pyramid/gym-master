"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ActividadForm from "../forms/ActividadForm";
import FechaHora from "@/components/ui/FechaHora";
import { Actividad } from "@/interfaces/actividad.interface";

export default function ActividadModal({
  open,
  onClose,
  onCreated,
  actividad,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  actividad?: Actividad | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {actividad ? "Editar Actividad" : "Nueva Actividad"}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <ActividadForm
          actividad={actividad}
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
