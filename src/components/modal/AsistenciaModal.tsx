"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AsistenciaForm from "../forms/AsistenciaForm";
import FechaHora from "@/components/ui/FechaHora";
import { Asistencia } from "@/interfaces/asistencia.interface";

export default function AsistenciaModal({
  open,
  onClose,
  onCreated,
  asistencia,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  asistencia?: Asistencia | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {asistencia ? "Editar Asistencia" : "Nueva Asistencia"}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <AsistenciaForm
          asistencia={asistencia}
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
