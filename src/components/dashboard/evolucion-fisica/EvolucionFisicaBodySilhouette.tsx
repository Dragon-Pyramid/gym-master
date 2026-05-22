"use client";

import { Activity, Dumbbell, Ruler, Scale } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";

interface EvolucionFisicaBodySilhouetteProps {
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
  abdomen: number | null;
  cuello: number | null;
  hombros: number | null;
}

interface BodyShape {
  shoulderWidth: number;
  chestWidth: number;
  waistWidth: number;
  hipWidth: number;
  armWidth: number;
  forearmWidth: number;
  thighWidth: number;
  calfWidth: number;
  abdomenWidth: number;
  neckWidth: number;
  headRadius: number;
  muscleTone: number;
  heatIntensity: number;
  silhouetteScale: number;
}

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

  return Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2));
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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

const getMetrics = (row: EvolucionSocio | null): BodyMetrics => ({
  peso: toNumber(row?.peso),
  cintura: toNumber(row?.cintura),
  pecho: toNumber(row?.pecho),
  cadera: toNumber(row?.cadera),
  grasa: toNumber(row?.porcentaje_grasa),
  masaMuscular: toNumber(row?.masa_muscular),
  brazoPromedio: average(row?.biceps_izquierdo, row?.biceps_derecho),
  musloPromedio: average(row?.muslo_izquierdo, row?.muslo_derecho),
  pantorrillaPromedio: average(row?.pantorrilla_izquierda, row?.pantorrilla_derecha),
  abdomen: toNumber(row?.abdomen),
  cuello: toNumber(row?.cuello),
  hombros: toNumber(row?.hombros),
});

const buildShape = (metrics: BodyMetrics): BodyShape => {
  const pecho = metrics.pecho ?? 104;
  const cintura = metrics.cintura ?? 88;
  const cadera = metrics.cadera ?? 98;
  const grasa = metrics.grasa ?? 24;
  const masa = metrics.masaMuscular ?? 52;
  const brazo = metrics.brazoPromedio ?? 34;
  const muslo = metrics.musloPromedio ?? 59;
  const pantorrilla = metrics.pantorrillaPromedio ?? 37;
  const abdomen = metrics.abdomen ?? cintura;
  const cuello = metrics.cuello ?? 38;
  const hombros = metrics.hombros ?? pecho;
  const peso = metrics.peso ?? 78;

  const shoulderWidth = clamp(hombros * 0.5 + pecho * 0.24 + masa * 0.08, 94, 144);
  const chestWidth = clamp(pecho * 0.74 + masa * 0.08 - grasa * 0.08, 78, 130);
  const waistWidth = clamp(cintura * 0.82 + grasa * 0.48 - masa * 0.16, 54, 122);
  const abdomenWidth = clamp(abdomen * 0.82 + grasa * 0.34 - masa * 0.08, 58, 124);
  const hipWidth = clamp(cadera * 0.72 + grasa * 0.12, 76, 132);
  const armWidth = clamp(brazo * 0.55 + masa * 0.06, 20, 34);
  const forearmWidth = clamp(armWidth * 0.68, 14, 24);
  const thighWidth = clamp(muslo * 0.55 + masa * 0.04, 34, 56);
  const calfWidth = clamp(pantorrilla * 0.48, 16, 31);
  const neckWidth = clamp(cuello * 0.52, 17, 29);
  const muscleTone = clamp(masa * 1.22, 42, 92);
  const heatIntensity = clamp(grasa * 2.8, 20, 88);
  const silhouetteScale = clamp(peso / 88, 0.92, 1.08);

  return {
    shoulderWidth,
    chestWidth,
    waistWidth,
    hipWidth,
    armWidth,
    forearmWidth,
    thighWidth,
    calfWidth,
    abdomenWidth,
    neckWidth,
    muscleTone,
    heatIntensity,
    silhouetteScale,
    headRadius: clamp(neckWidth * 0.94, 16, 22),
  };
};

const metricGrid = (metrics: BodyMetrics) => [
  { label: "Peso", value: formatNumber(metrics.peso, " kg"), icon: Scale },
  { label: "Cintura", value: formatNumber(metrics.cintura, " cm"), icon: Ruler },
  { label: "% grasa", value: formatNumber(metrics.grasa, "%"), icon: Activity },
  { label: "Masa", value: formatNumber(metrics.masaMuscular, " kg"), icon: Dumbbell },
  { label: "Brazo prom.", value: formatNumber(metrics.brazoPromedio, " cm"), icon: Ruler },
  { label: "Muslo prom.", value: formatNumber(metrics.musloPromedio, " cm"), icon: Ruler },
];

const wireHorizontal = [38, 50, 62, 76, 92, 108, 124, 140, 156, 172, 188, 204, 220, 238, 256, 274, 292, 310, 328, 344];
const wireVertical = [-58, -44, -30, -18, -8, 0, 8, 18, 30, 44, 58];
const wireContour = [-74, -62, -50, -38, -26, -14, 14, 26, 38, 50, 62, 74];

function HumanWireframeSilhouetteSvg({
  row,
  idPrefix,
}: {
  row: EvolucionSocio | null;
  idPrefix: string;
}) {
  const metrics = getMetrics(row);
  const shape = buildShape(metrics);
  const center = 130;
  const shoulderY = 92;
  const chestY = 128;
  const waistY = 180;
  const hipY = 226;
  const kneeY = 310;
  const ankleY = 368;

  const shoulderL = center - shape.shoulderWidth / 2;
  const shoulderR = center + shape.shoulderWidth / 2;
  const chestL = center - shape.chestWidth / 2;
  const chestR = center + shape.chestWidth / 2;
  const abdomenL = center - shape.abdomenWidth / 2;
  const abdomenR = center + shape.abdomenWidth / 2;
  const waistL = center - shape.waistWidth / 2;
  const waistR = center + shape.waistWidth / 2;
  const hipL = center - shape.hipWidth / 2;
  const hipR = center + shape.hipWidth / 2;

  const torsoPath = [
    `M ${shoulderL} ${shoulderY}`,
    `C ${chestL - 13} ${shoulderY + 16}, ${chestL - 10} ${chestY - 4}, ${chestL} ${chestY}`,
    `C ${abdomenL - 8} ${chestY + 30}, ${waistL - 4} ${waistY - 16}, ${waistL} ${waistY}`,
    `C ${waistL - 9} ${waistY + 24}, ${hipL} ${hipY - 12}, ${hipL} ${hipY}`,
    `C ${center - 38} ${hipY + 13}, ${center + 38} ${hipY + 13}, ${hipR} ${hipY}`,
    `C ${hipR} ${hipY - 12}, ${waistR + 9} ${waistY + 24}, ${waistR} ${waistY}`,
    `C ${waistR + 4} ${waistY - 16}, ${abdomenR + 8} ${chestY + 30}, ${chestR} ${chestY}`,
    `C ${chestR + 10} ${chestY - 4}, ${chestR + 13} ${shoulderY + 16}, ${shoulderR} ${shoulderY}`,
    `C ${center + 30} ${shoulderY - 16}, ${center - 30} ${shoulderY - 16}, ${shoulderL} ${shoulderY}`,
    "Z",
  ].join(" ");

  const headPath = `M ${center - shape.headRadius * 0.78} 42 C ${center - shape.headRadius * 0.9} 26, ${center - shape.headRadius * 0.35} 16, ${center} 16 C ${center + shape.headRadius * 0.35} 16, ${center + shape.headRadius * 0.9} 26, ${center + shape.headRadius * 0.78} 42 C ${center + shape.headRadius * 0.65} 60, ${center + shape.headRadius * 0.35} 67, ${center} 67 C ${center - shape.headRadius * 0.35} 67, ${center - shape.headRadius * 0.65} 60, ${center - shape.headRadius * 0.78} 42 Z`;

  const neckPath = `M ${center - shape.neckWidth / 2} 63 L ${center + shape.neckWidth / 2} 63 L ${center + shape.neckWidth / 2 + 3} 91 L ${center - shape.neckWidth / 2 - 3} 91 Z`;

  const leftArmPath = [
    `M ${shoulderL + 8} ${shoulderY + 6}`,
    `C ${shoulderL - 16} ${chestY - 2}, ${shoulderL - 25} ${waistY + 8}, ${shoulderL - 16} ${hipY - 2}`,
    `C ${shoulderL - 12} ${hipY + 13}, ${shoulderL - 2} ${hipY + 17}, ${shoulderL + 5} ${hipY + 2}`,
    `C ${shoulderL + 12} ${waistY + 4}, ${shoulderL + 9} ${chestY - 2}, ${shoulderL + 20} ${shoulderY + 18}`,
    `C ${shoulderL + 17} ${shoulderY + 10}, ${shoulderL + 13} ${shoulderY + 7}, ${shoulderL + 8} ${shoulderY + 6}`,
    "Z",
  ].join(" ");

  const rightArmPath = [
    `M ${shoulderR - 8} ${shoulderY + 6}`,
    `C ${shoulderR + 16} ${chestY - 2}, ${shoulderR + 25} ${waistY + 8}, ${shoulderR + 16} ${hipY - 2}`,
    `C ${shoulderR + 12} ${hipY + 13}, ${shoulderR + 2} ${hipY + 17}, ${shoulderR - 5} ${hipY + 2}`,
    `C ${shoulderR - 12} ${waistY + 4}, ${shoulderR - 9} ${chestY - 2}, ${shoulderR - 20} ${shoulderY + 18}`,
    `C ${shoulderR - 17} ${shoulderY + 10}, ${shoulderR - 13} ${shoulderY + 7}, ${shoulderR - 8} ${shoulderY + 6}`,
    "Z",
  ].join(" ");

  const leftLegPath = [
    `M ${center - 8} ${hipY}`,
    `C ${center - shape.thighWidth} ${hipY + 24}, ${center - shape.thighWidth + 2} ${kneeY - 10}, ${center - 18} ${kneeY}`,
    `C ${center - shape.calfWidth} ${kneeY + 24}, ${center - shape.calfWidth + 2} ${ankleY - 8}, ${center - 12} ${ankleY}`,
    `C ${center - 4} ${ankleY + 6}, ${center + 2} ${ankleY + 5}, ${center + 3} ${ankleY - 1}`,
    `C ${center - 2} ${kneeY + 28}, ${center - 2} ${hipY + 42}, ${center - 8} ${hipY}`,
    "Z",
  ].join(" ");

  const rightLegPath = [
    `M ${center + 8} ${hipY}`,
    `C ${center + shape.thighWidth} ${hipY + 24}, ${center + shape.thighWidth - 2} ${kneeY - 10}, ${center + 18} ${kneeY}`,
    `C ${center + shape.calfWidth} ${kneeY + 24}, ${center + shape.calfWidth - 2} ${ankleY - 8}, ${center + 12} ${ankleY}`,
    `C ${center + 4} ${ankleY + 6}, ${center - 2} ${ankleY + 5}, ${center - 3} ${ankleY - 1}`,
    `C ${center + 2} ${kneeY + 28}, ${center + 2} ${hipY + 42}, ${center + 8} ${hipY}`,
    "Z",
  ].join(" ");

  const bodyParts = [headPath, neckPath, torsoPath, leftArmPath, rightArmPath, leftLegPath, rightLegPath];
  const muscleOpacity = clamp(shape.muscleTone / 125, 0.35, 0.78);
  const heatOpacity = clamp(shape.heatIntensity / 120, 0.16, 0.64);

  return (
    <svg
      viewBox="0 0 260 390"
      className="h-[315px] w-full max-w-[300px]"
      role="img"
      aria-label="Silueta corporal wireframe dinámica"
    >
      <defs>
        <clipPath id={`${idPrefix}-body-clip`} clipPathUnits="userSpaceOnUse">
          {bodyParts.map((path, index) => (
            <path key={index} d={path} />
          ))}
        </clipPath>

        <radialGradient id={`${idPrefix}-core`} cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor="#ecfeff" stopOpacity="0.96" />
          <stop offset="42%" stopColor="#22d3ee" stopOpacity="0.68" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.25" />
        </radialGradient>

        <linearGradient id={`${idPrefix}-body-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.34" />
          <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.24" />
          <stop offset="70%" stopColor="#facc15" stopOpacity={heatOpacity} />
          <stop offset="100%" stopColor="#fb923c" stopOpacity={heatOpacity} />
        </linearGradient>

        <filter id={`${idPrefix}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${idPrefix}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#0f172a" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect x="0" y="0" width="260" height="390" rx="24" fill="#0f172a" />
      <circle cx="130" cy="185" r="112" fill="#0e7490" opacity="0.12" />
      <ellipse cx="130" cy="373" rx="72" ry="9" fill="#67e8f9" opacity="0.16" />

      <g transform={`translate(0 ${9 - (shape.silhouetteScale - 1) * 18}) scale(1 ${shape.silhouetteScale})`}>
        <g clipPath={`url(#${idPrefix}-body-clip)`}>
          <rect x="18" y="5" width="224" height="372" fill={`url(#${idPrefix}-body-fill)`} />
          <circle cx={center} cy={158} r="88" fill={`url(#${idPrefix}-core)`} opacity="0.34" />
          <ellipse cx={center} cy={waistY + 8} rx={clamp(shape.waistWidth * 0.42, 24, 55)} ry="26" fill="#fb923c" opacity={heatOpacity} />
          <ellipse cx={center} cy={chestY + 8} rx={clamp(shape.chestWidth * 0.36, 26, 48)} ry="18" fill="#e0f2fe" opacity="0.18" />

          {wireHorizontal.map((lineY) => (
            <path
              key={`h-${lineY}`}
              d={`M 18 ${lineY} C 72 ${lineY - 4}, 188 ${lineY + 4}, 242 ${lineY}`}
              fill="none"
              stroke="#a5f3fc"
              strokeWidth="0.75"
              strokeOpacity="0.68"
            />
          ))}

          {wireVertical.map((offset) => (
            <path
              key={`v-${offset}`}
              d={`M ${center + offset * 0.45} 18 C ${center + offset * 0.72} 95, ${center + offset * 0.58} 220, ${center + offset * 0.38} 373`}
              fill="none"
              stroke="#67e8f9"
              strokeWidth="0.75"
              strokeOpacity="0.7"
            />
          ))}

          {wireContour.map((offset) => (
            <path
              key={`c-${offset}`}
              d={`M ${center + offset * 0.16} 32 C ${center + offset} 112, ${center + offset * 0.78} 230, ${center + offset * 0.22} 360`}
              fill="none"
              stroke="#cffafe"
              strokeWidth="0.5"
              strokeOpacity="0.3"
            />
          ))}
        </g>

        {bodyParts.map((path, index) => (
          <path
            key={`outline-${index}`}
            d={path}
            fill="none"
            stroke="#67e8f9"
            strokeWidth={index === 0 ? 1.4 : 1.2}
            strokeOpacity="0.94"
            filter={`url(#${idPrefix}-glow)`}
          />
        ))}

        <path
          d={`M ${chestL + 10} ${chestY + 4} C ${center - 20} ${chestY + 26}, ${center - 20} ${waistY - 18}, ${waistL + 9} ${waistY}`}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeOpacity={muscleOpacity}
          strokeLinecap="round"
          filter={`url(#${idPrefix}-glow)`}
        />
        <path
          d={`M ${chestR - 10} ${chestY + 4} C ${center + 20} ${chestY + 26}, ${center + 20} ${waistY - 18}, ${waistR - 9} ${waistY}`}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeOpacity={muscleOpacity}
          strokeLinecap="round"
          filter={`url(#${idPrefix}-glow)`}
        />

        <path d={torsoPath} fill="none" stroke="#e0f2fe" strokeWidth="0.7" strokeOpacity="0.5" />
        <circle cx={center - 24} cy={chestY + 6} r="4" fill="#cffafe" opacity="0.65" />
        <circle cx={center + 24} cy={chestY + 6} r="4" fill="#cffafe" opacity="0.65" />
        <circle cx={center} cy={waistY + 2} r="3.5" fill="#fef3c7" opacity="0.78" />
      </g>
    </svg>
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

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
          <h3 className="text-lg font-bold text-gray-950">{caption}</h3>
        </div>
        <div className="rounded-xl bg-[#02a8e1]/10 p-2 text-[#02a8e1]">
          <Activity className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(230px,0.9fr)_1fr]">
        <div className="flex justify-center rounded-2xl border bg-slate-950 p-3 shadow-inner">
          <HumanWireframeSilhouetteSvg row={row} idPrefix={idPrefix} />
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

export default function EvolucionFisicaBodySilhouette({
  initial,
  current,
}: EvolucionFisicaBodySilhouetteProps) {
  if (!initial || !current) {
    return (
      <Card className="rounded-2xl border bg-white shadow-sm">
        <CardContent className="p-6 text-sm text-gray-500">
          La silueta dinámica requiere al menos un registro inicial y una última medición.
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
          Silueta dinámica antes vs. ahora
        </h3>
        <p className="text-sm text-gray-500">
          Prototipo 2.5D estilo wireframe médico: aproxima proporciones corporales, composición e intensidad visual desde las mediciones disponibles.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
          <SilhouetteCard
            row={initial}
            label="Antes"
            caption="Registro inicial"
            idPrefix="gm-initial-wire-body"
          />
          <SilhouetteCard
            row={current}
            label="Ahora"
            caption="Última medición"
            idPrefix="gm-current-wire-body"
          />

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-[#02a8e1]">
              Lectura automática
            </p>
            <h3 className="mt-1 text-lg font-bold text-gray-950">
              Cambios corporales detectados
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              La malla ajusta torso, cintura, cadera, brazos y piernas con las mediciones reales. Es un prototipo visual para análisis rápido, no una reconstrucción anatómica exacta.
            </p>

            <div className="mt-4 space-y-2">
              <DeltaRow label="Peso" value={diffPeso} suffix=" kg" direction="neutral" />
              <DeltaRow label="Cintura" value={diffCintura} suffix=" cm" direction="lower" />
              <DeltaRow label="% grasa" value={diffGrasa} suffix="%" direction="lower" />
              <DeltaRow label="Masa muscular" value={diffMasa} suffix=" kg" direction="higher" />
              <DeltaRow label="Brazo promedio" value={diffBrazo} suffix=" cm" direction="higher" />
              <DeltaRow label="Muslo promedio" value={diffMuslo} suffix=" cm" direction="higher" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
