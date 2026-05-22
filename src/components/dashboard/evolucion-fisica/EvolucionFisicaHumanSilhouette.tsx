"use client";

import { Activity, Dumbbell, Percent, Ruler, Scale } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";

type BodySex = "masculino" | "femenino";

interface EvolucionFisicaHumanSilhouetteProps {
  initial: EvolucionSocio | null;
  current: EvolucionSocio | null;
}

interface BodyMetrics {
  peso: number | null;
  cintura: number | null;
  pecho: number | null;
  cadera: number | null;
  grasa: number | null;
  masaMuscular: number | null;
  brazoPromedio: number | null;
  musloPromedio: number | null;
  pantorrillaPromedio: number | null;
  sexoReferencia: string | null;
}

interface BodyVisualModel {
  sex: BodySex;
  fitnessScore: number;
  dominantSrc: string;
  widthScale: number;
  heightScale: number;
  glowOpacity: number;
  abdomenOpacity: number;
  muscleOpacity: number;
}

const SILHOUETTES = {
  masculino: {
    soft: "/images/evolucion-fisica/siluetas/male-soft.png",
    athletic: "/images/evolucion-fisica/siluetas/male-athletic.png",
  },
  femenino: {
    soft: "/images/evolucion-fisica/siluetas/female-soft.png",
    athletic: "/images/evolucion-fisica/siluetas/female-athletic.png",
  },
} as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toNumber = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(value);
};

const average = (left?: number | null, right?: number | null) => {
  const values = [toNumber(left), toNumber(right)].filter(
    (value): value is number => value !== null
  );

  if (!values.length) return null;

  return Number(
    (values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2)
  );
};

const formatNumber = (value?: number | null, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
};

const delta = (current?: number | null, initial?: number | null) => {
  if (
    current === null ||
    current === undefined ||
    initial === null ||
    initial === undefined ||
    Number.isNaN(Number(current)) ||
    Number.isNaN(Number(initial))
  ) {
    return null;
  }

  return Number((Number(current) - Number(initial)).toFixed(2));
};

const signed = (value: number | null, suffix = "") => {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${formatNumber(value, suffix)}`;
};

const normalize = (value: number, base: number, divisor: number) =>
  clamp((value - base) / divisor, -1.4, 1.4);

const getMetrics = (row: EvolucionSocio | null): BodyMetrics => ({
  peso: toNumber(row?.peso),
  cintura: toNumber(row?.cintura),
  pecho: toNumber(row?.pecho),
  cadera: toNumber(row?.cadera),
  grasa: toNumber(row?.porcentaje_grasa),
  masaMuscular: toNumber(row?.masa_muscular),
  brazoPromedio: average(row?.biceps_izquierdo, row?.biceps_derecho),
  musloPromedio: average(row?.muslo_izquierdo, row?.muslo_derecho),
  pantorrillaPromedio: average(
    row?.pantorrilla_izquierda,
    row?.pantorrilla_derecha
  ),
  sexoReferencia: row?.sexo_referencia ?? null,
});

const inferSex = (metrics: BodyMetrics): BodySex => {
  if (metrics.sexoReferencia === "femenino") return "femenino";
  if (metrics.sexoReferencia === "masculino") return "masculino";

  const cadera = metrics.cadera ?? 98;
  const pecho = metrics.pecho ?? 100;
  const cintura = metrics.cintura ?? 84;

  if (cadera > pecho * 0.99 && cintura < cadera * 0.9) {
    return "femenino";
  }

  return "masculino";
};

const buildVisualModel = (metrics: BodyMetrics): BodyVisualModel => {
  const sex = inferSex(metrics);
  const female = sex === "femenino";

  const base = female
    ? { peso: 64, cintura: 74, cadera: 102, grasa: 25, masa: 44, brazo: 28, muslo: 56, pantorrilla: 36 }
    : { peso: 78, cintura: 86, cadera: 98, grasa: 20, masa: 56, brazo: 34, muslo: 60, pantorrilla: 38 };

  const peso = metrics.peso ?? base.peso;
  const cintura = metrics.cintura ?? base.cintura;
  const cadera = metrics.cadera ?? base.cadera;
  const grasa = metrics.grasa ?? base.grasa;
  const masa = metrics.masaMuscular ?? base.masa;
  const brazo = metrics.brazoPromedio ?? base.brazo;
  const muslo = metrics.musloPromedio ?? base.muslo;
  const pantorrilla = metrics.pantorrillaPromedio ?? base.pantorrilla;

  const pesoN = normalize(peso, base.peso, female ? 18 : 22);
  const cinturaN = normalize(cintura, base.cintura, female ? 11 : 13);
  const caderaN = normalize(cadera, base.cadera, female ? 12 : 14);
  const grasaN = normalize(grasa, base.grasa, 9);
  const masaN = normalize(masa, base.masa, female ? 7 : 9);
  const brazoN = normalize(brazo, base.brazo, female ? 4.5 : 5.5);
  const musloN = normalize(muslo, base.muslo, female ? 6 : 7);
  const pantorrillaN = normalize(pantorrilla, base.pantorrilla, 5);

  /**
   * No asume que el socio inicial sea obeso/sobrepeso.
   * El estado visual se decide por cada registro:
   * - baja grasa/cintura y suben masa, brazo o muslo => referencia athletic
   * - suben grasa/cintura/peso sin masa => referencia soft
   * - una persona delgada con baja masa no se fuerza a "sobrepeso".
   */
  const leanness = -grasaN * 0.28 - cinturaN * 0.24;
  const muscle = masaN * 0.28 + brazoN * 0.17 + musloN * 0.14 + pantorrillaN * 0.04;
  const bodyContext = -pesoN * 0.08 + caderaN * (female ? 0.03 : -0.02);
  const fitnessScore = clamp(0.5 + leanness + muscle + bodyContext, 0.08, 0.92);

  const volume =
    pesoN * 0.04 +
    cinturaN * 0.055 +
    caderaN * (female ? 0.035 : 0.02) +
    grasaN * 0.03 +
    masaN * 0.018;

  const muscleExpansion = masaN * 0.018 + brazoN * 0.016 + musloN * 0.012;

  const dominantSrc =
    fitnessScore >= 0.52 ? SILHOUETTES[sex].athletic : SILHOUETTES[sex].soft;

  return {
    sex,
    fitnessScore,
    dominantSrc,
    widthScale: clamp(1 + volume + muscleExpansion, 0.92, 1.1),
    heightScale: clamp(1 + pesoN * 0.006 - grasaN * 0.004, 0.985, 1.018),
    glowOpacity: clamp(0.24 + masaN * 0.055 - grasaN * 0.018, 0.18, 0.42),
    abdomenOpacity: clamp(0.12 + grasaN * 0.14 + cinturaN * 0.08, 0.08, 0.32),
    muscleOpacity: clamp(0.16 + masaN * 0.12 + brazoN * 0.04, 0.12, 0.34),
  };
};

const metricGrid = (metrics: BodyMetrics) => [
  { label: "Peso", value: formatNumber(metrics.peso, " kg"), icon: Scale },
  { label: "Cintura", value: formatNumber(metrics.cintura, " cm"), icon: Ruler },
  { label: "% grasa", value: formatNumber(metrics.grasa, "%"), icon: Percent },
  { label: "Masa", value: formatNumber(metrics.masaMuscular, " kg"), icon: Dumbbell },
  { label: "Brazo prom.", value: formatNumber(metrics.brazoPromedio, " cm"), icon: Ruler },
  { label: "Muslo prom.", value: formatNumber(metrics.musloPromedio, " cm"), icon: Ruler },
];

function SilhouetteVisual({ row, idPrefix }: { row: EvolucionSocio | null; idPrefix: string }) {
  const metrics = getMetrics(row);
  const model = buildVisualModel(metrics);
  const female = model.sex === "femenino";

  return (
    <div
      className="relative h-[470px] w-full max-w-[270px] overflow-hidden rounded-[26px] bg-[#031126]"
      aria-label={`Silueta corporal ${model.sex}`}
      role="img"
    >
      <div className="absolute inset-[14px] rounded-[22px] bg-[#071a32]" />
      <div className="absolute left-1/2 top-[42%] h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-sm" />
      <div className="absolute bottom-8 left-1/2 h-4 w-28 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-sm" />

      <div
        className="absolute inset-x-0 bottom-7 top-8 mx-auto flex items-end justify-center"
        style={{
          transform: `scaleX(${model.widthScale}) scaleY(${model.heightScale})`,
          transformOrigin: "50% 88%",
        }}
      >
        <img
          src={model.dominantSrc}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 max-h-full max-w-full object-contain drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]"
          style={{
            opacity: 1,
            filter: `saturate(1.14) brightness(1.05) drop-shadow(0 0 14px rgba(34,211,238,${model.glowOpacity + 0.08}))`,
          }}
        />
      </div>

      <svg className="pointer-events-none absolute inset-0" viewBox="0 0 270 470">
        <defs>
          <radialGradient id={`${idPrefix}-abdomen`} cx="50%" cy="52%" r="52%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.52" />
            <stop offset="48%" stopColor="#facc15" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${idPrefix}-muscle`} cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse
          cx="135"
          cy={female ? "240" : "228"}
          rx={female ? "44" : "50"}
          ry={female ? "58" : "52"}
          fill={`url(#${idPrefix}-abdomen)`}
          opacity={model.abdomenOpacity}
        />
        <ellipse
          cx="135"
          cy={female ? "168" : "158"}
          rx={female ? "48" : "56"}
          ry={female ? "34" : "38"}
          fill={`url(#${idPrefix}-muscle)`}
          opacity={model.muscleOpacity}
        />
      </svg>
    </div>
  );
}

function SilhouetteCard({
  row,
  label,
  caption,
  idPrefix,
}: {
  row: EvolucionSocio | null;
  label: string;
  caption: string;
  idPrefix: string;
}) {
  const metrics = getMetrics(row);
  const items = metricGrid(metrics);
  const sex = inferSex(metrics);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
          <h3 className="text-lg font-bold text-gray-950">{caption}</h3>
          <p className="mt-1 text-xs text-[#02a8e1]">
            Silueta {sex === "femenino" ? "femenina" : "masculina"} biométrica según medidas.
          </p>
        </div>
        <div className="rounded-xl bg-[#02a8e1]/10 p-2 text-[#02a8e1]">
          <Activity className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.86fr)_1fr]">
        <div className="flex justify-center rounded-2xl border bg-slate-950 p-3 shadow-inner">
          <SilhouetteVisual row={row} idPrefix={idPrefix} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {items.map(({ label: itemLabel, value, icon: Icon }) => (
            <div key={itemLabel} className="rounded-xl border bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                <Icon className="h-3.5 w-3.5" />
                {itemLabel}
              </div>
              <p className="mt-1 text-sm font-bold text-gray-950">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeltaRow({
  label,
  value,
  suffix,
  direction,
}: {
  label: string;
  value: number | null;
  suffix: string;
  direction: "lower" | "higher" | "neutral";
}) {
  const improved =
    value === null || value === 0
      ? false
      : direction === "lower"
      ? value < 0
      : direction === "higher"
      ? value > 0
      : false;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`font-bold ${improved ? "text-emerald-600" : "text-gray-950"}`}>
        {signed(value, suffix)}
      </span>
    </div>
  );
}

export default function EvolucionFisicaHumanSilhouette({
  initial,
  current,
}: EvolucionFisicaHumanSilhouetteProps) {
  if (!initial || !current) {
    return (
      <Card className="rounded-2xl border bg-white shadow-sm">
        <CardContent className="p-6 text-sm text-gray-500">
          La silueta humana requiere un registro inicial y una última medición.
        </CardContent>
      </Card>
    );
  }

  const initialMetrics = getMetrics(initial);
  const currentMetrics = getMetrics(current);

  const diffPeso = delta(currentMetrics.peso, initialMetrics.peso);
  const diffCintura = delta(currentMetrics.cintura, initialMetrics.cintura);
  const diffGrasa = delta(currentMetrics.grasa, initialMetrics.grasa);
  const diffMasa = delta(currentMetrics.masaMuscular, initialMetrics.masaMuscular);
  const diffBrazo = delta(currentMetrics.brazoPromedio, initialMetrics.brazoPromedio);
  const diffMuslo = delta(currentMetrics.musloPromedio, initialMetrics.musloPromedio);

  return (
    <Card className="rounded-2xl border bg-white shadow-sm">
      <CardHeader className="space-y-1 border-b p-4">
        <h3 className="text-lg font-semibold text-gray-950">
          Silueta humana frontal antes vs. ahora
        </h3>
        <p className="text-sm text-gray-500">
          Representación biométrica con una sola silueta dominante por registro. No asume que todo socio inicia con sobrepeso: ajusta el estado visual según grasa, cintura, masa muscular, brazos y piernas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
          <SilhouetteCard
            row={initial}
            label="Antes"
            caption="Registro inicial"
            idPrefix="gm-human-initial-reference"
          />
          <SilhouetteCard
            row={current}
            label="Ahora"
            caption="Última medición"
            idPrefix="gm-human-current-reference"
          />

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-[#02a8e1]">
              Lectura automática
            </p>
            <h3 className="mt-1 text-lg font-bold text-gray-950">
              Cambios corporales detectados
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              La silueta usa una referencia biométrica masculina/femenina dominante según composición corporal, evitando doble contorno, fantasma visual, cortes, bandas o figuras geométricas.
            </p>

            <div className="mt-4 space-y-2">
              <DeltaRow label="Peso" value={diffPeso} suffix=" kg" direction="neutral" />
              <DeltaRow label="Cintura" value={diffCintura} suffix=" cm" direction="lower" />
              <DeltaRow label="% grasa" value={diffGrasa} suffix="%" direction="lower" />
              <DeltaRow label="Masa muscular" value={diffMasa} suffix=" kg" direction="higher" />
              <DeltaRow label="Brazo promedio" value={diffBrazo} suffix=" cm" direction="higher" />
              <DeltaRow label="Muslo promedio" value={diffMuslo} suffix=" cm" direction="higher" />
            </div>

            <div className="mt-4 rounded-xl border bg-slate-50 p-3 text-xs leading-relaxed text-gray-500">
              Próxima iteración: calibrar más estados visuales para casos delgados, volumen muscular alto y recomposición corporal avanzada.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
