"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EntrenadorForm from "@/components/forms/EntrenadorForm";
import { Entrenador } from "@/interfaces/entrenador.interface";

export default function EntrenadorModal({
  open,
  onClose,
  onCreated,
  entrenador,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  entrenador?: Entrenador | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {entrenador ? "Editar Entrenador" : "Nuevo Entrenador"}
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleString()}
            </div>
          </div>
        </DialogHeader>
        <EntrenadorForm
          entrenador={entrenador}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
