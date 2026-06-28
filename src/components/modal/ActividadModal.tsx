"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
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
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-4xl lg:max-w-5xl">
        <QaFileNameBadge file="src/components/modal/ActividadModal.tsx" />
        <DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
