"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResponsePago } from "@/interfaces/pago.interface";
import { ReceiptText } from "lucide-react";

function money(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return `$${Number(value).toLocaleString("es-AR")}`;
}

function date(value?: string | null) {
  if (!value) return "-";
  return value;
}


function Pill({
  children,
  variant = "outline",
}: {
  children: React.ReactNode;
  variant?: "outline" | "destructive";
}) {
  const variantClass =
    variant === "destructive"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-border bg-background text-foreground";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${variantClass}`}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="min-h-10 rounded-md border bg-muted/60 px-3 py-2 text-sm text-foreground">
        {value === null || value === undefined || value === "" ? "-" : value}
      </div>
    </div>
  );
}

export default function PagoViewModal({
  open,
  onClose,
  pago,
  onReceiptDownload,
}: {
  open: boolean;
  onClose: () => void;
  pago?: ResponsePago | null;
  onReceiptDownload?: (pago: ResponsePago) => void;
}) {
  if (!pago) return null;

  const estado = pago.estado ?? "-";
  const metodo = pago.metodo_pago ?? "-";
  const periodoDesde = pago.periodo_desde ?? pago.fecha_pago;
  const periodoHasta = pago.periodo_hasta ?? pago.fecha_vencimiento;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[840px] !w-full bg-background text-foreground">
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Detalle del pago
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleString("es-AR")}
              </div>
            </div>

            {onReceiptDownload ? (
              <Button
                type="button"
                variant="outline"
                className="border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                onClick={() => onReceiptDownload(pago)}
              >
                <ReceiptText className="w-4 h-4 mr-2" />
                Descargar recibo PDF
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <Field label="Socio" value={pago.socio?.nombre_completo} />
          <Field label="Cuota" value={pago.cuota?.descripcion} />
          <Field label="Fecha de pago" value={date(pago.fecha_pago)} />
          <Field label="Fecha de vencimiento" value={date(pago.fecha_vencimiento)} />
          <Field label="Periodo desde" value={date(periodoDesde)} />
          <Field label="Periodo hasta" value={date(periodoHasta)} />
          <Field label="Meses cubiertos" value={pago.meses_cubiertos ?? 1} />
          <Field label="Monto pagado" value={money(pago.monto_pagado)} />
          <Field label="Total" value={money(pago.total ?? pago.monto_pagado)} />
          <Field label="Registrado por" value={pago.registrado_por?.nombre} />
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Método de pago
            </label>
            <div className="min-h-10 rounded-md border bg-muted/60 px-3 py-2 text-sm capitalize">
              <Pill variant="outline">{metodo}</Pill>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </label>
            <div className="min-h-10 rounded-md border bg-muted/60 px-3 py-2 text-sm capitalize">
              <Pill variant={estado === "cancelado" ? "destructive" : "outline"}>{estado}</Pill>
            </div>
          </div>
          <Field label="Stripe session" value={pago.stripe_session_id} />
          <Field label="Stripe payment intent" value={pago.stripe_payment_intent_id} />
        </div>

        {pago.observaciones ? (
          <div className="pt-4 mt-4 border-t">
            <Field label="Observaciones" value={pago.observaciones} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
