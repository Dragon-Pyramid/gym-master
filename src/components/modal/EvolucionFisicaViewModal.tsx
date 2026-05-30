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

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("es-AR");
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
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
  if (!evolucion) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-background text-foreground sm:max-w-[980px]">
        <QaFileNameBadge file="src/components/modal/EvolucionFisicaViewModal.tsx" />
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Detalle de evolución física
          </DialogTitle>
          <DialogDescription>
            {socioNombre ? `${socioNombre} · ` : ""}
            Registro del {formatDate(evolucion.fecha)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <DetailSection title="Datos principales" icon={CalendarDays}>
            <DetailItem label="Fecha" value={formatDate(evolucion.fecha)} />
            <DetailItem
              label="Registro inicial"
              value={evolucion.es_registro_inicial ? "Sí" : "No"}
            />
            <DetailItem
              label="Origen"
              value={formatText(evolucion.origen_registro)}
            />
            <DetailItem
              label="Tipo corporal"
              value={formatText(evolucion.tipo_corporal)}
            />
            <DetailItem
              label="Sexo referencia"
              value={formatText(evolucion.sexo_referencia)}
            />
            <DetailItem
              label="Actualizado"
              value={formatDate(evolucion.actualizado_en)}
            />
          </DetailSection>

          <DetailSection title="Composición corporal" icon={Scale}>
            <DetailItem label="Peso" value={formatNumber(evolucion.peso, " kg")} />
            <DetailItem label="Altura" value={formatNumber(evolucion.altura, " cm")} />
            <DetailItem label="IMC" value={formatNumber(evolucion.imc)} />
            <DetailItem
              label="% grasa"
              value={formatNumber(evolucion.porcentaje_grasa, "%")}
            />
            <DetailItem
              label="Masa muscular"
              value={formatNumber(evolucion.masa_muscular, " kg")}
            />
          </DetailSection>

          <DetailSection title="Medidas centrales" icon={Ruler}>
            <DetailItem label="Pecho" value={formatNumber(evolucion.pecho, " cm")} />
            <DetailItem label="Cintura" value={formatNumber(evolucion.cintura, " cm")} />
            <DetailItem label="Cadera" value={formatNumber(evolucion.cadera, " cm")} />
            <DetailItem label="Abdomen" value={formatNumber(evolucion.abdomen, " cm")} />
            <DetailItem label="Cuello" value={formatNumber(evolucion.cuello, " cm")} />
            <DetailItem label="Hombros" value={formatNumber(evolucion.hombros, " cm")} />
          </DetailSection>

          <DetailSection title="Brazos y piernas" icon={Dumbbell}>
            <DetailItem
              label="Antebrazo izquierdo"
              value={formatNumber(evolucion.antebrazo_izquierdo, " cm")}
            />
            <DetailItem
              label="Antebrazo derecho"
              value={formatNumber(evolucion.antebrazo_derecho, " cm")}
            />
            <DetailItem
              label="Bíceps izquierdo"
              value={formatNumber(evolucion.biceps_izquierdo, " cm")}
            />
            <DetailItem
              label="Bíceps derecho"
              value={formatNumber(evolucion.biceps_derecho, " cm")}
            />
            <DetailItem
              label="Tríceps izquierdo"
              value={formatNumber(evolucion.triceps_izquierdo, " cm")}
            />
            <DetailItem
              label="Tríceps derecho"
              value={formatNumber(evolucion.triceps_derecho, " cm")}
            />
            <DetailItem
              label="Muslo izquierdo"
              value={formatNumber(evolucion.muslo_izquierdo, " cm")}
            />
            <DetailItem
              label="Muslo derecho"
              value={formatNumber(evolucion.muslo_derecho, " cm")}
            />
            <DetailItem
              label="Pantorrilla izquierda"
              value={formatNumber(evolucion.pantorrilla_izquierda, " cm")}
            />
            <DetailItem
              label="Pantorrilla derecha"
              value={formatNumber(evolucion.pantorrilla_derecha, " cm")}
            />
          </DetailSection>

          {(evolucion.foto_frontal_url ||
            evolucion.foto_lateral_url ||
            evolucion.foto_espalda_url) && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">Fotografías</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Frontal", evolucion.foto_frontal_url],
                  ["Lateral", evolucion.foto_lateral_url],
                  ["Espalda", evolucion.foto_espalda_url],
                ].map(([label, url]) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border p-3 text-sm font-medium text-[#02a8e1] hover:bg-[#e6f7fd]"
                    >
                      Ver foto {String(label ?? "foto").toLowerCase()}
                    </a>
                  ) : null
                )}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Observaciones</h3>
            <div className="min-h-20 rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
              {evolucion.observaciones || "Sin observaciones registradas."}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
