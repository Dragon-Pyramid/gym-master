"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Proveedor, ProveedorEstado } from "@/interfaces/proveedor.interface";
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

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
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const dateLocale = locale === "en" ? "en-US" : "es-AR";
  if (!proveedor) return null;

  const estado = proveedor.estado ?? "activo";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[92vw] sm:!max-w-[960px] !w-full bg-background text-foreground max-h-[90vh] overflow-y-auto">
        <QaFileNameBadge file="src/components/modal/ProveedorViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {c("Detalle Proveedor")}
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date(), dateLocale)}
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {c("Datos comerciales y fiscales")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label={c("Nombre comercial")} value={proveedor.nombre} />
              <DetailField label={c("Razón social")} value={proveedor.razon_social} />
              <DetailField label={c("CUIT / RUC / identificación fiscal")} value={proveedor.identificacion_fiscal} />
              <DetailField label={c("Condición fiscal")} value={proveedor.condicion_fiscal} />
              <DetailField label={c("Rubro / categoría")} value={proveedor.rubro} />
              <DetailField label={c("Estado")} value={c(estadoLabel[estado] ?? "Activo")} />
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {c("Contacto y ubicación")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label={c("Contacto principal")} value={proveedor.contacto} />
              <DetailField label={c("Teléfono")} value={proveedor.telefono} />
              <DetailField label="WhatsApp" value={proveedor.whatsapp} />
              <DetailField label="Email" value={proveedor.email} />
              <DetailField label={c("Dirección")} value={proveedor.direccion} />
              <DetailField label={c("Ciudad")} value={proveedor.ciudad} />
              <DetailField label={c("Provincia")} value={proveedor.provincia} />
              <DetailField label={c("País")} value={proveedor.pais} />
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {c("Datos bancarios opcionales")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label={c("Banco")} value={proveedor.banco} />
              <DetailField label={c("Alias CBU/CVU")} value={proveedor.alias_cbu} />
              <DetailField label="CBU/CVU" value={proveedor.cbu_cvu} />
              <DetailField label={c("Titular de cuenta")} value={proveedor.titular_cuenta} />
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {c("Observaciones")}
            </h3>
            <div className="min-h-20 whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm">
              {proveedor.observaciones || c("Sin observaciones")}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
