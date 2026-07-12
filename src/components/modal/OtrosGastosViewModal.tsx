"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OtrosGastos } from "@/interfaces/otros_gastos.interface";
import { formatFrontendDateTime, formatFrontendDate } from "@/utils/dateFormat";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { ExternalLink } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import {
  getOtrosGastosEstadoLabel,
  getOtrosGastosMedioPagoLabel,
  getOtrosGastosTipoLabel,
  translateOtrosGastosDescription,
  translateOtrosGastosUi,
} from "@/utils/otrosGastosI18n";

function ReadOnlyField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="min-h-10 rounded-md border bg-gray-50 p-2 text-sm dark:border-neutral-800 dark:bg-neutral-950">
        {value === null || value === undefined || value === "" ? "-" : value}
      </div>
    </div>
  );
}

export default function OtrosGastosViewModal({
  open,
  onClose,
  gasto,
}: {
  open: boolean;
  onClose: () => void;
  gasto?: OtrosGastos | null;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateOtrosGastosUi(locale, text);

  if (!gasto) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-full !max-w-[900px] dark:border-neutral-800 dark:bg-neutral-950">
        <QaFileNameBadge file="src/components/modal/OtrosGastosViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{c("Detalle de gasto / egreso")}</DialogTitle>
          <div className="text-right text-sm text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <ReadOnlyField label={c("Descripción")} value={translateOtrosGastosDescription(locale, gasto.descripcion)} />
          <ReadOnlyField label={c("Tipo de gasto")} value={getOtrosGastosTipoLabel(locale, gasto.tipo_gasto?.nombre)} />
          <ReadOnlyField label={c("Monto")} value={formatCurrencyARS(Number(gasto.monto ?? 0))} />
          <ReadOnlyField label={c("Estado")} value={getOtrosGastosEstadoLabel(locale, gasto.estado)} />
          <ReadOnlyField label={c("Medio de pago")} value={getOtrosGastosMedioPagoLabel(locale, gasto.medio_pago)} />
          <ReadOnlyField label={c("Fecha del gasto")} value={formatFrontendDate(gasto.fecha)} />
          <ReadOnlyField label={c("Fecha vencimiento")} value={gasto.fecha_vencimiento ? formatFrontendDate(gasto.fecha_vencimiento) : "-"} />
          <ReadOnlyField label={c("Fecha pago")} value={gasto.fecha_pago ? formatFrontendDate(gasto.fecha_pago) : "-"} />
          <ReadOnlyField label={c("Período desde")} value={gasto.periodo_desde ? formatFrontendDate(gasto.periodo_desde) : "-"} />
          <ReadOnlyField label={c("Período hasta")} value={gasto.periodo_hasta ? formatFrontendDate(gasto.periodo_hasta) : "-"} />
          <ReadOnlyField label={c("Proveedor / entidad")} value={translateOtrosGastosDescription(locale, gasto.proveedor_nombre || gasto.entidad)} />
          <ReadOnlyField label={c("Nº comprobante")} value={gasto.numero_comprobante} />
        </div>

        <div className="mt-5 space-y-2">
          <label className="text-sm font-medium">{c("Observaciones")}</label>
          <div className="min-h-20 rounded-md border bg-gray-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950">
            {translateOtrosGastosDescription(locale, gasto.observaciones)}
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-muted/20 p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold">{c("Comprobante")}</h3>
              <p className="text-sm text-muted-foreground">
                {gasto.comprobante_nombre || gasto.comprobante_url || c("Sin comprobante adjunto")}
              </p>
            </div>
            {gasto.comprobante_url ? (
              <Button type="button" variant="outline" asChild>
                <a href={gasto.comprobante_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {c("Abrir comprobante")}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
