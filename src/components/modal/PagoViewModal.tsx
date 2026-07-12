"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResponsePago } from "@/interfaces/pago.interface";
import { ReceiptText } from "lucide-react";
import { formatFrontendDateTime } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";

function money(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return `$${Number(value).toLocaleString("es-AR")}`;
}

function date(value?: string | null) {
  if (!value) return "-";
  return value;
}

function normalizeLabel(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function translatePaymentMethod(
  value: string | null | undefined,
  isEnglish: boolean,
) {
  if (!isEnglish) return value ?? "-";
  const normalized = normalizeLabel(value);
  const labels: Record<string, string> = {
    efectivo: "Cash",
    transferencia: "Bank transfer",
    stripe: "Stripe",
    mercado_pago: "Mercado Pago",
    "mercado pago": "Mercado Pago",
    tarjeta: "Card",
    debito: "Debit card",
    débito: "Debit card",
    credito: "Credit card",
    crédito: "Credit card",
    otro: "Other",
  };
  return labels[normalized] ?? value ?? "-";
}

function translatePaymentStatus(
  value: string | null | undefined,
  isEnglish: boolean,
) {
  if (!isEnglish) return value ?? "-";
  const normalized = normalizeLabel(value);
  const labels: Record<string, string> = {
    pagado: "Paid",
    pendiente: "Pending",
    cancelado: "Canceled",
    rechazado: "Rejected",
    vencido: "Overdue",
  };
  return labels[normalized] ?? value ?? "-";
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
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/45 dark:text-red-300"
      : "border-border bg-background text-foreground dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variantClass}`}
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
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-neutral-400">
        {label}
      </label>
      <div className="min-h-10 rounded-md border bg-muted/60 px-3 py-2 text-sm text-foreground dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-100">
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
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  if (!pago) return null;

  const estado = pago.estado ?? "-";
  const metodo = pago.metodo_pago ?? "-";
  const periodoDesde = pago.periodo_desde ?? pago.fecha_pago;
  const periodoHasta = pago.periodo_hasta ?? pago.fecha_vencimiento;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[840px] !w-full bg-background text-foreground dark:border-neutral-800 dark:bg-neutral-950 dark:text-white">
        <QaFileNameBadge file="src/components/modal/PagoViewModal.tsx" />
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground dark:text-white">
                {tx("Detalle del pago", "Payment detail")}
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                {formatFrontendDateTime(new Date())}
              </div>
            </div>

            {onReceiptDownload ? (
              <Button
                type="button"
                variant="outline"
                className="border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:border-cyan-800 dark:bg-neutral-950 dark:text-cyan-300 dark:hover:bg-neutral-900"
                onClick={() => onReceiptDownload(pago)}
              >
                <ReceiptText className="w-4 h-4 mr-2" />
                {tx("Descargar recibo PDF", "Download PDF receipt")}
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <Field
            label={tx("Socio", "Member")}
            value={pago.socio?.nombre_completo}
          />
          <Field label={tx("Cuota", "Fee")} value={pago.cuota?.descripcion} />
          <Field
            label={tx("Fecha de pago", "Payment date")}
            value={date(pago.fecha_pago)}
          />
          <Field
            label={tx("Fecha de vencimiento", "Due date")}
            value={date(pago.fecha_vencimiento)}
          />
          <Field
            label={tx("Período desde", "Period from")}
            value={date(periodoDesde)}
          />
          <Field
            label={tx("Período hasta", "Period to")}
            value={date(periodoHasta)}
          />
          <Field
            label={tx("Meses cubiertos", "Covered months")}
            value={pago.meses_cubiertos ?? 1}
          />
          <Field
            label="Subtotal"
            value={money(pago.subtotal ?? pago.monto_pagado)}
          />
          <Field
            label={tx("Descuento", "Discount")}
            value={
              Number(pago.descuento_monto ?? 0) > 0
                ? `${money(pago.descuento_monto)} (${pago.descuento_porcentaje ?? 0}%)`
                : money(0)
            }
          />
          <Field
            label={tx("Monto pagado", "Amount paid")}
            value={money(pago.monto_pagado)}
          />
          <Field label="Total" value={money(pago.total ?? pago.monto_pagado)} />
          <Field
            label={tx("Registrado por", "Registered by")}
            value={pago.registrado_por?.nombre}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4 mt-4 border-t dark:border-neutral-800 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-neutral-400">
              {tx("Método de pago", "Payment method")}
            </label>
            <div className="min-h-10 rounded-md border bg-muted/60 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900/80">
              <Pill variant="outline">
                {translatePaymentMethod(metodo, isEnglish)}
              </Pill>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-neutral-400">
              {tx("Estado", "Status")}
            </label>
            <div className="min-h-10 rounded-md border bg-muted/60 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900/80">
              <Pill
                variant={estado === "cancelado" ? "destructive" : "outline"}
              >
                {translatePaymentStatus(estado, isEnglish)}
              </Pill>
            </div>
          </div>
          <Field label="Stripe session" value={pago.stripe_session_id} />
          <Field
            label="Stripe payment intent"
            value={pago.stripe_payment_intent_id}
          />
        </div>

        {pago.observaciones ? (
          <div className="pt-4 mt-4 border-t dark:border-neutral-800">
            <Field
              label={tx("Observaciones", "Notes")}
              value={pago.observaciones}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
