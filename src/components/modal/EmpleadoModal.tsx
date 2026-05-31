"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import EmpleadoForm from "@/components/forms/EmpleadoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empleado } from "@/interfaces/empleado.interface";
import { formatFrontendDateTime } from "@/utils/dateFormat";

export default function EmpleadoModal({
  open,
  onClose,
  onCreated,
  empleado,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  empleado?: Empleado | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/EmpleadoModal.tsx" />
        <DialogHeader>
          <div className="flex w-full items-center justify-between gap-4">
            <DialogTitle>{empleado ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
            <div className="text-sm text-muted-foreground">{formatFrontendDateTime(new Date())}</div>
          </div>
        </DialogHeader>
        <EmpleadoForm
          empleado={empleado}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
