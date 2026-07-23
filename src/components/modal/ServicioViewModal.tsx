"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Servicio } from "@/interfaces/servicio.interface";
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { formatCurrencyARS } from '@/lib/comercial/productos';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

const CATEGORIA_LABELS: Record<string, string> = {
  personal_trainer: "Personal trainer",
  evaluacion: "Evaluación física",
  nutricion: "Nutrición",
  clase_especial: "Clase especial",
  pase: "Pase / acceso",
  alquiler: "Alquiler de espacio",
  premium: "Servicio premium",
  otro: "Otro",
};

const MODALIDAD_LABELS: Record<string, string> = {
  presencial: "Presencial",
  online: "Online",
  mixto: "Mixto",
};

export default function ServicioViewModal({
  open,
  onClose,
  servicio,
}: {
  open: boolean;
  onClose: () => void;
  servicio?: Servicio | null;
}) {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);
  const dateLocale = locale === 'en' ? 'en-US' : 'es-AR';

  if (!servicio) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[900px] !w-full bg-background text-foreground">
        <QaFileNameBadge file="src/components/modal/ServicioViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {c("Detalle Servicio")}
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date(), dateLocale)}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Nombre")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground">
                {servicio.nombre || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Descripción")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground whitespace-pre-line">
                {servicio.descripcion || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Código comercial / QR")}</label>
              <div className="p-2 border rounded-md bg-muted font-mono text-foreground">
                {servicio.codigo || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{c("Observaciones internas")}</label>
              <div className="p-2 border rounded-md bg-muted text-foreground whitespace-pre-line">
                {servicio.observaciones || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{c("Precio")}</label>
                <div className="p-2 border rounded-md bg-muted text-foreground">
                  {formatCurrencyARS(servicio.precio || 0, locale)}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{c("Activo")}</label>
                <div className="p-2 border rounded-md bg-muted text-foreground">
                  {servicio.activo ? c("Sí") : c("No")}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{c("Categoría")}</label>
                <div className="p-2 border rounded-md bg-muted text-foreground">
                  {c(CATEGORIA_LABELS[String(servicio.categoria ?? "otro")] ?? "Otro")}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{c("Modalidad")}</label>
                <div className="p-2 border rounded-md bg-muted text-foreground">
                  {c(MODALIDAD_LABELS[String(servicio.modalidad ?? "presencial")] ?? "Presencial")}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{c("Duración")}</label>
                <div className="p-2 border rounded-md bg-muted text-foreground">
                  {servicio.duracion_minutos ? `${servicio.duracion_minutos} ${c("minutos")}` : "-"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{c("Cupo máximo")}</label>
                <div className="p-2 border rounded-md bg-muted text-foreground">
                  {servicio.cupo_maximo ?? "-"}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{c("Requiere reserva")}</label>
                <div className="p-2 border rounded-md bg-muted text-foreground">
                  {servicio.requiere_reserva ? c("Sí") : c("No")}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{c("Venta online futura")}</label>
                <div className="p-2 border rounded-md bg-muted text-foreground">
                  {servicio.disponible_online ? c("Sí") : c("No")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
