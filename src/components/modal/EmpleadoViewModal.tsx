"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empleado } from "@/interfaces/empleado.interface";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { formatFrontendDate, formatFrontendDateTime } from "@/utils/dateFormat";

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{label}</label>
    <div className="rounded-md border bg-muted p-2 text-foreground">{value === null || value === undefined || value === "" ? "-" : value}</div>
  </div>
);

export default function EmpleadoViewModal({
  open,
  onClose,
  empleado,
}: {
  open: boolean;
  onClose: () => void;
  empleado?: Empleado | null;
}) {
  if (!empleado) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-full !max-w-[900px] bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/EmpleadoViewModal.tsx" />
        <DialogHeader>
          <div className="flex w-full items-center justify-between gap-4">
            <DialogTitle className="text-xl font-semibold text-foreground">Detalle de empleado</DialogTitle>
            <div className="text-sm text-muted-foreground">{formatFrontendDateTime(new Date())}</div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Nombre completo" value={empleado.nombre_completo} />
          <Field label="DNI" value={empleado.dni} />
          <Field label="Tipo" value={empleado.tipo_empleado?.nombre || "Sin tipo"} />
          <Field label="Puesto" value={empleado.puesto} />
          <Field label="Área" value={empleado.area} />
          <Field label="Turno" value={empleado.turno} />
          <Field label="Email" value={empleado.email} />
          <Field label="Teléfono" value={empleado.telefono} />
          <Field label="Dirección" value={empleado.direccion} />
          <Field label="Fecha de nacimiento" value={formatFrontendDate(empleado.fecha_nacimiento)} />
          <Field label="Fecha de alta" value={formatFrontendDate(empleado.fecha_alta)} />
          <Field label="Fecha de inicio laboral" value={formatFrontendDate(empleado.fecha_inicio)} />
          <Field label="Fecha de baja laboral" value={formatFrontendDate(empleado.fecha_fin)} />
          <Field label="Tipo de contratación" value={empleado.tipo_contratacion} />
          <Field label="Sueldo base" value={formatCurrencyARS(empleado.sueldo_base ?? 0)} />
          <Field label="Estado" value={empleado.activo === false ? "Inactivo" : "Activo"} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <Field label="Horarios / disponibilidad" value={empleado.horarios_texto || "Sin horarios cargados"} />
          <Field label="Observaciones" value={empleado.observaciones || "Sin observaciones"} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
