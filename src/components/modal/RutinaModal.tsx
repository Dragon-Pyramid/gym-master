"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RutinasForm from "../forms/RutinasForm";
import FechaHora from "@/components/ui/FechaHora";
import { Objetivo } from "@/interfaces/objetivo.interface";
import { Nivel } from "@/interfaces/niveles.interface";

export default function RutinaModal({
  open,
  onClose,
  onCreated,
  rutina,
  objetivos,
  niveles,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  rutina?: any | null;
  objetivos: Objetivo[];
  niveles: Nivel[];
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-4">
            <DialogTitle>
              {rutina ? "Editar Rutina" : "Generar Nueva Rutina"}
            </DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <RutinasForm
          initialValues={rutina}
          onSubmit={async () => {
            await onCreated();
            onClose();
          }}
          objetivos={objetivos}
          niveles={niveles}
        />
      </DialogContent>
    </Dialog>
  );
}
