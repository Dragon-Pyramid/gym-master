"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Proveedor, ProveedorEstado } from "@/interfaces/proveedor.interface";
import { formatFrontendDateTime, formatFrontendDate } from '@/utils/dateFormat';

const estadoLabel: Record<ProveedorEstado, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  discontinuado: "Discontinuado",
};

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="min-h-10 rounded-md border bg-muted p-2 text-foreground">
        {value || "-"}
      </div>
    </div>
  );
}

export default function ProveedorViewModal({
  open,
  onClose,
  proveedor,
}: {
  open: boolean;
  onClose: () => void;
  proveedor?: Proveedor | null;
}) {
  if (!proveedor) return null;

  const estado = proveedor.estado ?? "activo";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[92vw] sm:!max-w-[960px] !w-full bg-background text-foreground max-h-[90vh] overflow-y-auto">
        <QaFileNameBadge file="src/components/modal/ProveedorViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Detalle Proveedor
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Datos comerciales y fiscales
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label="Nombre comercial" value={proveedor.nombre} />
              <DetailField label="Razón social" value={proveedor.razon_social} />
              <DetailField label="CUIT / RUC / identificación fiscal" value={proveedor.identificacion_fiscal} />
              <DetailField label="Condición fiscal" value={proveedor.condicion_fiscal} />
              <DetailField label="Rubro / categoría" value={proveedor.rubro} />
              <DetailField label="Estado" value={estadoLabel[estado] ?? "Activo"} />
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contacto y ubicación
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label="Contacto principal" value={proveedor.contacto} />
              <DetailField label="Teléfono" value={proveedor.telefono} />
              <DetailField label="WhatsApp" value={proveedor.whatsapp} />
              <DetailField label="Email" value={proveedor.email} />
              <DetailField label="Dirección" value={proveedor.direccion} />
              <DetailField label="Ciudad" value={proveedor.ciudad} />
              <DetailField label="Provincia" value={proveedor.provincia} />
              <DetailField label="País" value={proveedor.pais} />
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Datos bancarios opcionales
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label="Banco" value={proveedor.banco} />
              <DetailField label="Alias CBU/CVU" value={proveedor.alias_cbu} />
              <DetailField label="CBU/CVU" value={proveedor.cbu_cvu} />
              <DetailField label="Titular de cuenta" value={proveedor.titular_cuenta} />
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Observaciones
            </h3>
            <div className="min-h-20 whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm">
              {proveedor.observaciones || "Sin observaciones"}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
