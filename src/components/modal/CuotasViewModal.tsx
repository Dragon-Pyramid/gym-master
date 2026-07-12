"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cuota } from "@/interfaces/cuota.interface";
import { formatFrontendDateTime, formatFrontendDate } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";

function translateFeeDescription(value: string | null | undefined, isEnglish: boolean) {
  if (!value || !isEnglish) return value || "-";

  const monthMap: Record<string, string> = {
    ENERO: "JANUARY",
    FEBRERO: "FEBRUARY",
    MARZO: "MARCH",
    ABRIL: "APRIL",
    MAYO: "MAY",
    JUNIO: "JUNE",
    JULIO: "JULY",
    AGOSTO: "AUGUST",
    SEPTIEMBRE: "SEPTEMBER",
    SETIEMBRE: "SEPTEMBER",
    OCTUBRE: "OCTOBER",
    NOVIEMBRE: "NOVEMBER",
    DICIEMBRE: "DECEMBER",
  };

  return value.replace(
    /\b(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi,
    (match) => monthMap[match.toUpperCase()] || match,
  );
}

export default function CuotasViewModal({
  open,
  onClose,
  cuota,
}: {
  open: boolean;
  onClose: () => void;
  cuota?: Cuota | null;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  if (!cuota) return null;

  const fieldClassName = "p-2 border rounded-md bg-muted text-foreground dark:border-neutral-800 dark:bg-black dark:text-neutral-100";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] sm:!max-w-[800px] !w-full bg-background text-foreground dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
        <QaFileNameBadge file="src/components/modal/CuotasViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {tx("Detalle Cuota", "Fee detail")}
          </DialogTitle>
          <div className="text-sm text-right text-muted-foreground">
            {formatFrontendDateTime(new Date())}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{tx("Descripción", "Description")}</label>
              <div className={fieldClassName}>
                {translateFeeDescription(cuota.descripcion, isEnglish)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tx("Monto", "Amount")}</label>
              <div className={fieldClassName}>
                {cuota.monto || "-"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tx("Período", "Period")}</label>
              <div className={fieldClassName}>
                {cuota.periodo || "-"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{tx("Fecha de Inicio", "Start date")}</label>
              <div className={fieldClassName}>
                {formatFrontendDate(cuota.fecha_inicio)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{tx("Fecha de Fin", "End date")}</label>
              <div className={fieldClassName}>
                {formatFrontendDate(cuota.fecha_fin)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
