"use client";

import { Pencil, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { ResponsePago } from "@/interfaces/pago.interface";
import { useI18n } from "@/i18n/I18nProvider";

function money(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return `$${Number(value).toLocaleString("es-AR")}`;
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
    cash: "Cash",
    transferencia: "Bank transfer",
    transfer: "Bank transfer",
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
    paid: "Paid",
    pendiente: "Pending",
    pending: "Pending",
    cancelado: "Canceled",
    cancelled: "Canceled",
    canceled: "Canceled",
    rechazado: "Rejected",
    vencido: "Overdue",
  };
  return labels[normalized] ?? value ?? "-";
}

export default function PagoTable({
  pagos,
  loading,
  onEdit,
  onView,
  onDelete,
  onReceipt,
}: {
  pagos: ResponsePago[];
  loading?: boolean;
  onEdit: (pago: ResponsePago) => void;
  onView?: (pago: ResponsePago) => void;
  onDelete?: (pago: ResponsePago) => void;
  onReceipt?: (pago: ResponsePago) => void;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full rounded-md h-9" />
        ))}
      </div>
    );
  }

  if (pagos.length === 0 && !loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {tx(
          "No hay pagos registrados aún.",
          "No payments have been registered yet.",
        )}
      </div>
    );
  }

  return (
    <Table className="w-full overflow-hidden text-sm border rounded-md border-border dark:border-neutral-800">
      <TableHeader>
        <TableRow className="bg-muted/50 text-muted-foreground dark:bg-neutral-900/80 dark:text-neutral-300">
          <TableHead>{tx("Socio", "Member")}</TableHead>
          <TableHead>{tx("Cuota", "Fee")}</TableHead>
          <TableHead>{tx("Fecha pago", "Payment date")}</TableHead>
          <TableHead>{tx("Cobertura", "Coverage")}</TableHead>
          <TableHead>{tx("Método", "Method")}</TableHead>
          <TableHead>{tx("Estado", "Status")}</TableHead>
          <TableHead>{tx("Monto", "Amount")}</TableHead>
          <TableHead>{tx("Registrado por", "Registered by")}</TableHead>
          <TableHead>{tx("Acciones", "Actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagos.map((p) => (
          <TableRow
            key={p.id}
            className="odd:bg-muted/40 transition-colors hover:bg-[#a8d9f9] dark:odd:bg-neutral-950/50 dark:hover:bg-neutral-800/80"
          >
            <TableCell className="font-medium">
              {p.socio?.nombre_completo ?? "-"}
            </TableCell>
            <TableCell>{p.cuota?.descripcion ?? "-"}</TableCell>
            <TableCell>{p.fecha_pago}</TableCell>
            <TableCell>
              <div className="flex flex-col text-xs">
                <span>{p.periodo_desde ?? p.fecha_pago}</span>
                <span>
                  {tx("hasta", "to")} {p.periodo_hasta ?? p.fecha_vencimiento}
                </span>
                <span>
                  {p.meses_cubiertos ?? 1} {tx("mes/es", "month(s)")}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {translatePaymentMethod(p.metodo_pago, isEnglish)}
            </TableCell>
            <TableCell>{translatePaymentStatus(p.estado, isEnglish)}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{money(p.monto_pagado)}</span>
                {Number(p.descuento_monto ?? 0) > 0 ? (
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    {tx("Desc.", "Disc.")} {money(p.descuento_monto)} (
                    {p.descuento_porcentaje ?? 0}%)
                  </span>
                ) : null}
              </div>
            </TableCell>
            <TableCell>{p.registrado_por?.nombre ?? "-"}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView && onView(p)}
              >
                {tx("Ver", "View")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReceipt && onReceipt(p)}
                title={tx("Descargar recibo PDF", "Download PDF receipt")}
              >
                <ReceiptText className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(p)}
                title={tx("Editar", "Edit")}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white w-[100px]"
                onClick={() => onDelete && onDelete(p)}
              >
                {tx("Eliminar", "Delete")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="dark:bg-neutral-900/80">
          <TableCell colSpan={8}>
            {tx("Total de pagos", "Total payments")}
          </TableCell>
          <TableCell className="text-right">{pagos.length}</TableCell>
        </TableRow>
      </TableFooter>
      <TableCaption>
        {tx("Listado de pagos registrados.", "Registered payments list.")}
      </TableCaption>
    </Table>
  );
}
