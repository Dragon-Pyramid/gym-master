"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import type { ComponentType, ReactNode } from "react";
import { CalendarDays, Dumbbell, Ruler, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";
import { formatFrontendDate } from '@/utils/dateFormat';
import { useI18n } from "@/i18n/I18nProvider";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : formatFrontendDate(value);
};

const formatNumber = (value?: number | null, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
};

const formatText = (value?: string | null) => {
  if (!value?.trim()) return "-";
  return value.replace(/_/g, " ");
};

const translateValue = (value: string, tx: (es: string, en: string) => string) => {
  const normalized = value.trim().toLowerCase();
  const map: Record<string, string> = {
    mesomorfo: "Mesomorph",
    endomorfo: "Endomorph",
    ectomorfo: "Ectomorph",
    masculino: "Male",
    femenino: "Female",
    manual: "Manual",
    admin: "Admin",
    socio: "Member",
  };

  return tx(value, map[normalized] ?? value);
};


const translateObservation = (
  value: string | null | undefined,
  tx: (es: string, en: string) => string
) => {
  if (!value?.trim()) return "";
  const translated = value
    .replace(
      "Registro actual con mejora notable:",
      "Current record with notable improvement:"
    )
    .replace(
      "reducción importante de grasa y cintura",
      "significant reduction in fat and waist"
    )
    .replace("aumento de masa muscular", "increased muscle mass")
    .replace(
      "mayor desarrollo de pecho, hombros, brazos, muslos y pantorrillas",
      "greater development in chest, shoulders, arms, thighs, and calves"
    )
    .replace("Registro inicial histórico.", "Historical initial record.")
    .replace(
      "Punto de partida con medidas base para comparar la evolución física del socio.",
      "Starting point with baseline measurements to compare the member's physical evolution."
    )
    .replace(
      "Punto de partida con mediciones base para comparar la evolución física del socio.",
      "Starting point with baseline measurements to compare the member's physical evolution."
    )
    .replace(
      "Punto de partida con medidas base para comparación.",
      "Starting point with baseline measurements for comparison."
    )
    .replace(
      "Punto de partida con mediciones base para comparación.",
      "Starting point with baseline measurements for comparison."
    )
    .replace("Punto de partida", "Starting point");
  return tx(value, translated);
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border bg-muted/20 p-3">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
  </div>
);

const DetailSection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f7fd] text-[#02a8e1]">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">{children}</div>
  </section>
);

export default function EvolucionFisicaViewModal({
  open,
  onClose,
  evolucion,
  socioNombre,
}: {
  open: boolean;
  onClose: () => void;
  evolucion?: EvolucionSocio | null;
  socioNombre?: string;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  if (!evolucion) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-[95vw] overflow-y-auto bg-background p-4 text-foreground sm:max-w-[980px] sm:p-6">
        <QaFileNameBadge file="src/components/modal/EvolucionFisicaViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-lg font-bold sm:text-xl">
            {tx("Detalle de evolución física", "Physical evolution detail")}
          </DialogTitle>
          <DialogDescription>
            {socioNombre ? `${socioNombre} · ` : ""}
            {tx("Registro del", "Record from")} {formatDate(evolucion.fecha)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <DetailSection title={tx("Datos principales", "Main data")} icon={CalendarDays}>
            <DetailItem label={tx("Fecha", "Date")} value={formatDate(evolucion.fecha)} />
            <DetailItem
              label={tx("Registro inicial", "Initial record")}
              value={evolucion.es_registro_inicial ? tx("Sí", "Yes") : tx("No", "No")}
            />
            <DetailItem
              label={tx("Origen", "Source")}
              value={translateValue(formatText(evolucion.origen_registro), tx)}
            />
            <DetailItem
              label={tx("Tipo corporal", "Body type")}
              value={translateValue(formatText(evolucion.tipo_corporal), tx)}
            />
            <DetailItem
              label={tx("Sexo referencia", "Reference sex")}
              value={translateValue(formatText(evolucion.sexo_referencia), tx)}
            />
            <DetailItem
              label={tx("Actualizado", "Updated")}
              value={formatDate(evolucion.actualizado_en)}
            />
          </DetailSection>

          <DetailSection title={tx("Composición corporal", "Body composition")} icon={Scale}>
            <DetailItem label={tx("Peso", "Weight")} value={formatNumber(evolucion.peso, " kg")} />
            <DetailItem label={tx("Altura", "Height")} value={formatNumber(evolucion.altura, " cm")} />
            <DetailItem label={tx("IMC", "BMI")} value={formatNumber(evolucion.imc)} />
            <DetailItem
              label={tx("% grasa", "Fat %")}
              value={formatNumber(evolucion.porcentaje_grasa, "%")}
            />
            <DetailItem
              label={tx("Masa muscular", "Muscle mass")}
              value={formatNumber(evolucion.masa_muscular, " kg")}
            />
          </DetailSection>

          <DetailSection title={tx("Medidas centrales", "Core measurements")} icon={Ruler}>
            <DetailItem label={tx("Pecho", "Chest")} value={formatNumber(evolucion.pecho, " cm")} />
            <DetailItem label={tx("Cintura", "Waist")} value={formatNumber(evolucion.cintura, " cm")} />
            <DetailItem label={tx("Cadera", "Hip")} value={formatNumber(evolucion.cadera, " cm")} />
            <DetailItem label={tx("Abdomen", "Abdomen")} value={formatNumber(evolucion.abdomen, " cm")} />
            <DetailItem label={tx("Cuello", "Neck")} value={formatNumber(evolucion.cuello, " cm")} />
            <DetailItem label={tx("Hombros", "Shoulders")} value={formatNumber(evolucion.hombros, " cm")} />
          </DetailSection>

          <DetailSection title={tx("Brazos y piernas", "Arms and legs")} icon={Dumbbell}>
            <DetailItem
              label={tx("Antebrazo izquierdo", "Left forearm")}
              value={formatNumber(evolucion.antebrazo_izquierdo, " cm")}
            />
            <DetailItem
              label={tx("Antebrazo derecho", "Right forearm")}
              value={formatNumber(evolucion.antebrazo_derecho, " cm")}
            />
            <DetailItem
              label={tx("Bíceps izquierdo", "Left biceps")}
              value={formatNumber(evolucion.biceps_izquierdo, " cm")}
            />
            <DetailItem
              label={tx("Bíceps derecho", "Right biceps")}
              value={formatNumber(evolucion.biceps_derecho, " cm")}
            />
            <DetailItem
              label={tx("Tríceps izquierdo", "Left triceps")}
              value={formatNumber(evolucion.triceps_izquierdo, " cm")}
            />
            <DetailItem
              label={tx("Tríceps derecho", "Right triceps")}
              value={formatNumber(evolucion.triceps_derecho, " cm")}
            />
            <DetailItem
              label={tx("Muslo izquierdo", "Left thigh")}
              value={formatNumber(evolucion.muslo_izquierdo, " cm")}
            />
            <DetailItem
              label={tx("Muslo derecho", "Right thigh")}
              value={formatNumber(evolucion.muslo_derecho, " cm")}
            />
            <DetailItem
              label={tx("Pantorrilla izquierda", "Left calf")}
              value={formatNumber(evolucion.pantorrilla_izquierda, " cm")}
            />
            <DetailItem
              label={tx("Pantorrilla derecha", "Right calf")}
              value={formatNumber(evolucion.pantorrilla_derecha, " cm")}
            />
          </DetailSection>

          {(evolucion.foto_frontal_url ||
            evolucion.foto_lateral_url ||
            evolucion.foto_espalda_url) && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">{tx("Fotografías", "Photos")}</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  [tx("Frontal", "Front"), evolucion.foto_frontal_url],
                  [tx("Lateral", "Side"), evolucion.foto_lateral_url],
                  [tx("Espalda", "Back"), evolucion.foto_espalda_url],
                ].map(([label, url]) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border p-3 text-sm font-medium text-[#02a8e1] hover:bg-[#e6f7fd]"
                    >
                      {tx("Ver foto", "View photo")} {String(label ?? tx("foto", "photo")).toLowerCase()}
                    </a>
                  ) : null
                )}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">{tx("Observaciones", "Notes")}</h3>
            <div className="min-h-20 rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
              {translateObservation(evolucion.observaciones, tx) || tx("Sin observaciones registradas.", "No notes recorded.")}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tx("Cerrar", "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
