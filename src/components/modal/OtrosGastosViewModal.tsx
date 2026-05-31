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

function ReadOnlyField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="min-h-10 rounded-md border bg-gray-50 p-2 text-sm">
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
  if (!gasto) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-full !max-w-[900px]">
        <QaFileNameBadge file="src/components/modal/OtrosGastosViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Detalle de gasto / egreso</DialogTitle>
          <div className="text-right text-sm text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <ReadOnlyField label="Descripción" value={gasto.descripcion} />
          <ReadOnlyField label="Tipo de gasto" value={gasto.tipo_gasto?.nombre ?? "Sin clasificar"} />
          <ReadOnlyField label="Monto" value={formatCurrencyARS(Number(gasto.monto ?? 0))} />
          <ReadOnlyField label="Estado" value={gasto.estado ?? "-"} />
          <ReadOnlyField label="Medio de pago" value={gasto.medio_pago?.replace(/_/g, " ") ?? "-"} />
          <ReadOnlyField label="Fecha del gasto" value={formatFrontendDate(gasto.fecha)} />
          <ReadOnlyField label="Fecha vencimiento" value={gasto.fecha_vencimiento ? formatFrontendDate(gasto.fecha_vencimiento) : "-"} />
          <ReadOnlyField label="Fecha pago" value={gasto.fecha_pago ? formatFrontendDate(gasto.fecha_pago) : "-"} />
          <ReadOnlyField label="Período desde" value={gasto.periodo_desde ? formatFrontendDate(gasto.periodo_desde) : "-"} />
          <ReadOnlyField label="Período hasta" value={gasto.periodo_hasta ? formatFrontendDate(gasto.periodo_hasta) : "-"} />
          <ReadOnlyField label="Proveedor / entidad" value={gasto.proveedor_nombre || gasto.entidad} />
          <ReadOnlyField label="Nº comprobante" value={gasto.numero_comprobante} />
        </div>

        <div className="mt-5 space-y-2">
          <label className="text-sm font-medium">Observaciones</label>
          <div className="min-h-20 rounded-md border bg-gray-50 p-3 text-sm">
            {gasto.observaciones || "-"}
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold">Comprobante</h3>
              <p className="text-sm text-muted-foreground">
                {gasto.comprobante_nombre || gasto.comprobante_url || "Sin comprobante adjunto"}
              </p>
            </div>
            {gasto.comprobante_url ? (
              <Button type="button" variant="outline" asChild>
                <a href={gasto.comprobante_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir comprobante
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
