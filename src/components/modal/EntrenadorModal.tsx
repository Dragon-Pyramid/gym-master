"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EntrenadorForm from "@/components/forms/EntrenadorForm";
import { Entrenador } from "@/interfaces/entrenador.interface";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';

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
        <QaFileNameBadge file="src/components/modal/EntrenadorModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>
              {entrenador ? "Editar Entrenador" : "Nuevo Entrenador"}
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              {formatFrontendDateTime(new Date())}
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
