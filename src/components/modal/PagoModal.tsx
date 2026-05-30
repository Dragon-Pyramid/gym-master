"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PagoForm from "../forms/PagoForm";
import FechaHora from "@/components/ui/FechaHora";

export default function PagoModal({
  open,
  onClose,
  onCreated,
  pago,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  pago?: any | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/PagoModal.tsx" />
        <DialogHeader>
          <div className="flex gap-4 justify-between items-center w-full">
            <DialogTitle>{pago ? "Editar Pago" : "Nuevo Pago"}</DialogTitle>
            <FechaHora />
          </div>
        </DialogHeader>
        <PagoForm
          pago={pago}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
