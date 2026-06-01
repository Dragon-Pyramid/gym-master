"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmpleadoSueldo } from "@/interfaces/empleado_sueldo.interface";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { formatFrontendDate, formatFrontendDateTime } from "@/utils/dateFormat";

function estadoLabel(value?: string | null) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function medioPagoLabel(value?: string | null) {
  if (!value) return "-";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <label className="space-y-1 text-sm font-medium">
      {label}
      <div className="rounded-md border bg-muted/40 px-3 py-2 font-normal">
        {value === null || value === undefined || value === "" ? "-" : value}
      </div>
    </label>
  );
}

export default function EmpleadoSueldoViewModal({
  open,
  onClose,
  sueldo,
  onDownloadReceipt,
}: {
  open: boolean;
  onClose: () => void;
  sueldo?: EmpleadoSueldo | null;
  onDownloadReceipt?: (sueldo: EmpleadoSueldo) => void;
}) {
  if (!sueldo) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl">
        <QaFileNameBadge file="src/components/modal/EmpleadoSueldoViewModal.tsx" />
        <DialogHeader>
          <div className="flex w-full items-center justify-between gap-4">
            <DialogTitle>Detalle de sueldo</DialogTitle>
            <div className="text-sm text-muted-foreground">{formatFrontendDateTime(new Date())}</div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Empleado" value={sueldo.empleado?.nombre_completo ?? sueldo.empleado_id} />
          <Field label="DNI" value={sueldo.empleado?.dni} />
          <Field label="Período" value={formatFrontendDate(sueldo.periodo)} />
          <Field label="Concepto" value={sueldo.concepto} />
          <Field label="Sueldo base" value={formatCurrencyARS(sueldo.sueldo_base)} />
          <Field label="Bonos" value={formatCurrencyARS(sueldo.bonos)} />
          <Field label="Descuentos" value={formatCurrencyARS(sueldo.descuentos)} />
          <Field label="Monto neto" value={formatCurrencyARS(sueldo.monto_neto)} />
          <Field label="Estado" value={estadoLabel(sueldo.estado)} />
          <Field label="Medio de pago" value={medioPagoLabel(sueldo.medio_pago)} />
          <Field label="Fecha de pago" value={formatFrontendDate(sueldo.fecha_pago)} />
          <Field label="Comprobante" value={sueldo.comprobante_url} />
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 text-sm">
          <div className="font-semibold">Observaciones</div>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
            {sueldo.observaciones || "Sin observaciones."}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {sueldo.comprobante_url ? (
            <Button type="button" variant="outline" onClick={() => window.open(sueldo.comprobante_url || "", "_blank")}>
              Abrir comprobante
            </Button>
          ) : null}
          {onDownloadReceipt ? (
            <Button type="button" onClick={() => onDownloadReceipt(sueldo)}>
              Descargar recibo PDF
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
