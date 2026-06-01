"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import EmpleadoSueldoForm from "@/components/forms/EmpleadoSueldoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empleado } from "@/interfaces/empleado.interface";
import { EmpleadoSueldo } from "@/interfaces/empleado_sueldo.interface";
import { formatFrontendDateTime } from "@/utils/dateFormat";

export default function EmpleadoSueldoModal({
  open,
  onClose,
  onCreated,
  sueldo,
  empleados,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  sueldo?: EmpleadoSueldo | null;
  empleados: Empleado[];
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl sm:max-w-4xl">
        <QaFileNameBadge file="src/components/modal/EmpleadoSueldoModal.tsx" />
        <DialogHeader>
          <div className="flex w-full items-center justify-between gap-4">
            <DialogTitle>{sueldo ? "Editar sueldo" : "Nuevo sueldo"}</DialogTitle>
            <div className="text-sm text-muted-foreground">{formatFrontendDateTime(new Date())}</div>
          </div>
        </DialogHeader>
        <EmpleadoSueldoForm
          sueldo={sueldo}
          empleados={empleados}
          onCreated={async () => {
            await onCreated();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
