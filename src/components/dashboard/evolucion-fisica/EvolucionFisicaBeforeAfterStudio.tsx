"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  Dumbbell,
  Eye,
  Layers3,
  Ruler,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";
import { formatFrontendDate, formatFrontendShortDate } from "@/utils/dateFormat";

type ViewMode = "slider" | "overlay" | "heatmap";
type BodyView = "front" | "back";
type BodyGroupId =
  | "peso"
  | "pecho"
  | "abdomen"
  | "cintura"
  | "cadera"
  | "hombros"
  | "biceps"
  | "triceps"
  | "antebrazo"
  | "muslo"
  | "pantorrilla";
type ImprovementDirection = "higher" | "lower" | "neutral";
type BodySex = "masculino" | "femenino";

const HUMAN_SILHOUETTES = {
  masculino: {
    soft: "/images/evolucion-fisica/siluetas/male-soft.png",
    athletic: "/images/evolucion-fisica/siluetas/male-athletic.png",
    back: "/images/evolucion-fisica/siluetas/male-athletic-back.png",
  },
  femenino: {
    soft: "/images/evolucion-fisica/siluetas/female-soft.png",
    athletic: "/images/evolucion-fisica/siluetas/female-athletic.png",
    back: "/images/evolucion-fisica/siluetas/female-athletic-back.png",
  },
} as const;

interface EvolucionFisicaBeforeAfterStudioProps {
  rows: EvolucionSocio[];
  socioNombre?: string;
}

interface BodyMetrics {
  peso: number | null;
  imc: number | null;
  cintura: number | null;
  pecho: number | null;
  cadera: number | null;
  abdomen: number | null;
  cuello: number | null;
  hombros: number | null;
  biceps: number | null;
  triceps: number | null;
  antebrazo: number | null;
  muslo: number | null;
  pantorrilla: number | null;
  porcentajeGrasa: number | null;
  masaMuscular: number | null;
  sexoReferencia: string | null;
}

interface BodyGroupDescriptor {
  id: BodyGroupId;
  label: string;
  unit: string;
  direction: ImprovementDirection;
  description: string;
  getValue: (metrics: BodyMetrics) => number | null;
}

interface BodyGroupState extends BodyGroupDescriptor {
  before: number | null;
  after: number | null;
  delta: number | null;
  score: number;
  tone: "improved" | "regressed" | "stable" | "missing";
}

const BODY_GROUPS: BodyGroupDescriptor[] = [
  {
    id: "peso",
    label: "Peso",
    unit: "kg",
    direction: "neutral",
    description: "Cambio general de peso. Se interpreta junto a grasa, cintura y masa muscular.",
    getValue: (metrics) => metrics.peso,
  },
  {
    id: "pecho",
    label: "Pecho",
    unit: "cm",
    direction: "higher",
    description: "Referencia de torso superior. Suele mejorar por hipertrofia o recomposición.",
    getValue: (metrics) => metrics.pecho,
  },
  {
    id: "abdomen",
    label: "Abdomen",
    unit: "cm",
    direction: "lower",
    description: "Zona central sensible para recomposición y reducción de perímetro abdominal.",
    getValue: (metrics) => metrics.abdomen ?? metrics.cintura,
  },
  {
    id: "cintura",
    label: "Cintura",
    unit: "cm",
    direction: "lower",
    description: "Indicador clave para pérdida de grasa y control de perímetro central.",
    getValue: (metrics) => metrics.cintura,
  },
  {
    id: "cadera",
    label: "Cadera",
    unit: "cm",
    direction: "neutral",
    description: "Medida de base corporal. Se evalúa con cintura, abdomen y glúteos.",
    getValue: (metrics) => metrics.cadera,
  },
  {
    id: "hombros",
    label: "Hombros",
    unit: "cm",
    direction: "higher",
    description: "Volumen estructural del torso superior y desarrollo postural.",
    getValue: (metrics) => metrics.hombros,
  },
  {
    id: "biceps",
    label: "Bíceps promedio",
    unit: "cm",
    direction: "higher",
    description: "Promedio izquierdo/derecho para medir desarrollo de brazos.",
    getValue: (metrics) => metrics.biceps,
  },
  {
    id: "triceps",
    label: "Tríceps promedio",
    unit: "cm",
    direction: "higher",
    description: "Promedio posterior de brazo, útil para vista dorsal y equilibrio muscular.",
    getValue: (metrics) => metrics.triceps,
  },
  {
    id: "antebrazo",
    label: "Antebrazo promedio",
    unit: "cm",
    direction: "higher",
    description: "Promedio de antebrazos, útil para fuerza de agarre y simetría.",
    getValue: (metrics) => metrics.antebrazo,
  },
  {
    id: "muslo",
    label: "Muslo promedio",
    unit: "cm",
    direction: "higher",
    description: "Promedio izquierdo/derecho para evolución de tren inferior.",
    getValue: (metrics) => metrics.muslo,
  },
  {
    id: "pantorrilla",
    label: "Pantorrilla promedio",
    unit: "cm",
    direction: "higher",
    description: "Promedio de pantorrillas para progreso y simetría de piernas.",
    getValue: (metrics) => metrics.pantorrilla,
  },
];

const numberOrNull = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  return Number(value);
};

const average = (...values: Array<number | null | undefined>) => {
  const valid = values
    .map(numberOrNull)
    .filter((value): value is number => value !== null);

  if (!valid.length) return null;

  return Number((valid.reduce((acc, value) => acc + value, 0) / valid.length).toFixed(2));
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatNumber = (value?: number | null, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toLocaleString("es-AR", { maximumFractionDigits: 2 })}${suffix}`;
};

const formatSigned = (value: number | null, suffix = "") => {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${formatNumber(value, suffix)}`;
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : formatFrontendDate(value);
};

const formatShortDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : formatFrontendShortDate(value);
};

const rowKey = (row: EvolucionSocio, index: number) =>
  row.id || row.id_evolucion || `${row.socio_id}-${row.fecha}-${index}`;

const getMetrics = (row: EvolucionSocio | null): BodyMetrics => ({
  peso: numberOrNull(row?.peso),
  imc: numberOrNull(row?.imc),
  cintura: numberOrNull(row?.cintura),
  pecho: numberOrNull(row?.pecho),
  cadera: numberOrNull(row?.cadera),
  abdomen: numberOrNull(row?.abdomen),
  cuello: numberOrNull(row?.cuello),
  hombros: numberOrNull(row?.hombros),
  biceps: average(row?.biceps_izquierdo, row?.biceps_derecho, row?.bicep),
  triceps: average(row?.triceps_izquierdo, row?.triceps_derecho, row?.tricep),
  antebrazo: average(row?.antebrazo_izquierdo, row?.antebrazo_derecho),
  muslo: average(row?.muslo_izquierdo, row?.muslo_derecho, row?.pierna),
  pantorrilla: average(row?.pantorrilla_izquierda, row?.pantorrilla_derecha, row?.pantorrilla),
  porcentajeGrasa: numberOrNull(row?.porcentaje_grasa),
  masaMuscular: numberOrNull(row?.masa_muscular),
  sexoReferencia: row?.sexo_referencia ?? null,
});

const getRowExplicitSex = (row: EvolucionSocio | null): BodySex | null => {
  if (!row) return null;
  const anyRow = row as Record<string, any>;
  return normalizeSex(
    anyRow?.sexo_referencia ??
      anyRow?.sexoReferencia ??
      anyRow?.sexo ??
      anyRow?.genero ??
      anyRow?.genero_referencia ??
      anyRow?.sexo_socio ??
      anyRow?.sexoSocio ??
      anyRow?.socio?.sexo ??
      anyRow?.socio?.genero ??
      null
  );
};

const inferSexFromDisplayName = (value?: string | null): BodySex | null => {
  if (!value) return null;

  const firstName = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)[0];

  const femaleNames = new Set([
    "laura",
    "maria",
    "ana",
    "sofia",
    "valentina",
    "camila",
    "lucia",
    "martina",
    "paula",
    "carolina",
    "andrea",
    "gabriela",
    "florencia",
    "natalia",
    "romina",
    "veronica",
    "julieta",
    "agustina",
    "mariana",
    "fernanda",
    "victoria",
    "patricia",
    "claudia",
    "silvia",
  ]);

  const maleNames = new Set([
    "gustavo",
    "juan",
    "jose",
    "carlos",
    "miguel",
    "luis",
    "jorge",
    "martin",
    "facundo",
    "lucas",
    "matias",
    "diego",
    "pablo",
    "sebastian",
    "alejandro",
    "fernando",
    "ricardo",
    "roberto",
    "daniel",
    "marcelo",
  ]);

  if (femaleNames.has(firstName)) return "femenino";
  if (maleNames.has(firstName)) return "masculino";

  return null;
};

const resolveReferenceSex = ({
  rows,
  beforeRow,
  afterRow,
  beforeMetrics,
  afterMetrics,
  socioNombre,
}: {
  rows: EvolucionSocio[];
  beforeRow: EvolucionSocio | null;
  afterRow: EvolucionSocio | null;
  beforeMetrics: BodyMetrics;
  afterMetrics: BodyMetrics;
  socioNombre?: string | null;
}): BodySex => {
  const nameSex = inferSexFromDisplayName(socioNombre);

  if (nameSex) return nameSex;

  const explicit = [
    getRowExplicitSex(afterRow),
    getRowExplicitSex(beforeRow),
    ...[...rows].reverse().map((row) => getRowExplicitSex(row)),
    normalizeSex(afterMetrics.sexoReferencia),
    normalizeSex(beforeMetrics.sexoReferencia),
  ].find((value): value is BodySex => value === "masculino" || value === "femenino");

  if (explicit) return explicit;

  const inferredAfter = inferSex(afterMetrics);
  const inferredBefore = inferSex(beforeMetrics);

  if (inferredAfter === inferredBefore) return inferredAfter;

  return inferredAfter;
};

const getDelta = (after: number | null, before: number | null) => {
  if (after === null || before === null) return null;
  return Number((after - before).toFixed(2));
};

const getTone = (
  delta: number | null,
  direction: ImprovementDirection
): BodyGroupState["tone"] => {
  if (delta === null) return "missing";
  if (Math.abs(delta) < 0.15) return "stable";
  if (direction === "neutral") return "stable";
  if (direction === "lower") return delta < 0 ? "improved" : "regressed";
  return delta > 0 ? "improved" : "regressed";
};

const getScore = (delta: number | null, direction: ImprovementDirection) => {
  if (delta === null) return 0;
  const normalized = clamp(Math.abs(delta) / 8, 0.12, 1);
  if (direction === "neutral") return normalized * 0.35;
  const improved = direction === "lower" ? delta < 0 : delta > 0;
  return improved ? normalized : -normalized;
};

const buildGroupStates = (before: BodyMetrics, after: BodyMetrics): BodyGroupState[] =>
  BODY_GROUPS.map((group) => {
    const beforeValue = group.getValue(before);
    const afterValue = group.getValue(after);
    const delta = getDelta(afterValue, beforeValue);
    const tone = getTone(delta, group.direction);

    return {
      ...group,
      before: beforeValue,
      after: afterValue,
      delta,
      score: getScore(delta, group.direction),
      tone,
    };
  });

const getColor = (state?: BodyGroupState, fallback = "#38bdf8") => {
  if (!state || state.tone === "missing") return "#64748b";
  if (state.tone === "improved") return "#22c55e";
  if (state.tone === "regressed") return "#f97316";
  return fallback;
};

const getSoftColor = (state?: BodyGroupState) => {
  if (!state || state.tone === "missing") return "rgba(100,116,139,0.32)";
  if (state.tone === "improved") return "rgba(34,197,94,0.52)";
  if (state.tone === "regressed") return "rgba(249,115,22,0.52)";
  return "rgba(56,189,248,0.42)";
};

const getPartOpacity = (state?: BodyGroupState, active = false) => {
  if (active) return 0.95;
  if (!state || state.tone === "missing") return 0.42;
  return state.tone === "stable" ? 0.62 : 0.82;
};

const getActiveGlow = (state?: BodyGroupState) => {
  const color = getColor(state, "#22d3ee");

  return [
    `drop-shadow(0 0 6px ${color})`,
    `drop-shadow(0 0 14px ${color})`,
    "drop-shadow(0 0 24px rgba(34,211,238,0.72))",
  ].join(" ");
};

const getActiveFill = (state?: BodyGroupState, fallback = "#22d3ee") => {
  if (!state || state.tone === "missing") return fallback;
  if (state.tone === "improved") return "#22ff88";
  if (state.tone === "regressed") return "#ff9a3d";
  return "#38d5ff";
};


const getShapeModel = (metrics: BodyMetrics) => {
  const peso = metrics.peso ?? 76;
  const cintura = metrics.cintura ?? 84;
  const abdomen = metrics.abdomen ?? cintura;
  const pecho = metrics.pecho ?? 102;
  const cadera = metrics.cadera ?? 98;
  const hombros = metrics.hombros ?? pecho;
  const biceps = metrics.biceps ?? 33;
  const antebrazo = metrics.antebrazo ?? 28;
  const muslo = metrics.muslo ?? 58;
  const pantorrilla = metrics.pantorrilla ?? 37;
  const grasa = metrics.porcentajeGrasa ?? 22;
  const masa = metrics.masaMuscular ?? 52;

  return {
    shoulder: clamp(1 + (hombros - 106) / 180 + (masa - 52) / 520, 0.88, 1.16),
    chest: clamp(1 + (pecho - 102) / 190 + (masa - 52) / 700, 0.88, 1.16),
    waist: clamp(1 + (cintura - 84) / 170 + (grasa - 22) / 520, 0.72, 1.14),
    abdomen: clamp(1 + (abdomen - 84) / 170 + (grasa - 22) / 420, 0.72, 1.18),
    hip: clamp(1 + (cadera - 98) / 190, 0.84, 1.14),
    arm: clamp(1 + (biceps - 33) / 110 + (masa - 52) / 900, 0.76, 1.18),
    forearm: clamp(1 + (antebrazo - 28) / 110, 0.76, 1.08),
    thigh: clamp(1 + (muslo - 58) / 145 + (peso - 76) / 780, 0.82, 1.18),
    calf: clamp(1 + (pantorrilla - 37) / 95, 0.78, 1.14),
    lean: clamp(1 + (masa - 52) / 280 - (grasa - 22) / 320, 0.82, 1.2),
  };
};

const normalizeSex = (value?: string | null): BodySex | null => {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  if (["f", "femenino", "female", "mujer"].includes(normalized)) return "femenino";
  if (["m", "masculino", "male", "hombre"].includes(normalized)) return "masculino";
  return null;
};

const inferSex = (metrics: BodyMetrics): BodySex => {
  const explicit = normalizeSex(metrics.sexoReferencia);
  if (explicit) return explicit;

  const cadera = metrics.cadera ?? 98;
  const pecho = metrics.pecho ?? 100;
  const cintura = metrics.cintura ?? 84;

  if (cadera - pecho > 4 || cadera - cintura > 16) return "femenino";
  return "masculino";
};

const getFrontSilhouetteSrc = (metrics: BodyMetrics) => {
  const sex = inferSex(metrics);

  if (sex === "masculino") {
    return { sex, src: HUMAN_SILHOUETTES.masculino.athletic };
  }

  const masa = metrics.masaMuscular ?? 52;
  const grasa = metrics.porcentajeGrasa ?? 22;
  const tone = masa - grasa * 0.35 >= 44 ? "athletic" : "soft";
  return { sex, src: HUMAN_SILHOUETTES[sex][tone] };
};

const getBackSilhouetteSrc = (metrics: BodyMetrics) => {
  const sex = inferSex(metrics);
  return { sex, src: HUMAN_SILHOUETTES[sex].back };
};


const humanPathModel = (metrics: BodyMetrics) => {
  const base = getShapeModel(metrics);
  const sex = inferSex(metrics);
  return {
    sex,
    shoulder: base.shoulder * (sex === "femenino" ? 0.93 : 1.03),
    chest: base.chest * (sex === "femenino" ? 0.92 : 1.02),
    waist: base.waist * (sex === "femenino" ? 0.9 : 1),
    abdomen: base.abdomen * (sex === "femenino" ? 0.92 : 1),
    hip: base.hip * (sex === "femenino" ? 1.07 : 0.98),
    arm: base.arm * (sex === "femenino" ? 0.92 : 1.02),
    forearm: base.forearm * (sex === "femenino" ? 0.92 : 1),
    thigh: base.thigh * (sex === "femenino" ? 1.04 : 1),
    calf: base.calf * (sex === "femenino" ? 0.96 : 1),
  };
};

const getCompositeScore = (states: BodyGroupState[]) => {
  if (!states.length) return 0;
  const scored = states.filter((state) => state.delta !== null && state.direction !== "neutral");
  if (!scored.length) return 0;
  return scored.reduce((acc, state) => acc + state.score, 0) / scored.length;
};

const getSummaryText = (states: BodyGroupState[]) => {
  const improved = states.filter((state) => state.tone === "improved");
  const regressed = states.filter((state) => state.tone === "regressed");

  if (!improved.length && !regressed.length) {
    return "La comparación no detecta cambios significativos o faltan mediciones comparables.";
  }

  const improvedText = improved.slice(0, 3).map((state) => state.label.toLowerCase()).join(", ");
  const regressedText = regressed.slice(0, 2).map((state) => state.label.toLowerCase()).join(", ");

  if (improved.length && regressed.length) {
    return `Mejoras en ${improvedText}; revisar ${regressedText} para ajustar entrenamiento, nutrición o descanso.`;
  }

  if (improved.length) {
    return `Evolución favorable en ${improvedText}. Mantener seguimiento para confirmar tendencia.`;
  }

  return `Atención en ${regressedText}. Conviene revisar contexto del período y ajustar el plan.`;
};

const viewModes: Array<{ id: ViewMode; label: string; icon: typeof Layers3 }> = [
  { id: "slider", label: "Slider", icon: ArrowLeftRight },
  { id: "overlay", label: "Superpuesto", icon: Layers3 },
  { id: "heatmap", label: "Heatmap", icon: Sparkles },
];

const bodyViews: Array<{ id: BodyView; label: string }> = [
  { id: "front", label: "Frente" },
  { id: "back", label: "Espalda" },
];

// Ajuste fino opcional por grupo muscular.
// Separamos coordenadas por sexo para poder calibrar hombre y mujer de forma independiente
// sin perder la alineación ya lograda en masculino.
// Editar solo estos valores si alguna figura geométrica se superpone con otra.
// translate(x y): x horizontal, y vertical. scale(n): tamaño del grupo.
const MUSCLE_TRANSFORMS_BY_SEX: Record<"masculino" | "femenino", Partial<Record<BodyGroupId, string>>> = {
  masculino: {
    hombros: "translate(0 0) scale(1)",
    pecho: "translate(0 0) scale(1)",
    abdomen: "translate(0 0) scale(1)",
    cintura: "translate(0 0) scale(1)",
    cadera: "translate(0 4) scale(1)",
    biceps: "translate(60 0) scale(0.5)",
    triceps: "translate(60 0) scale(0.5)",
    antebrazo: "translate(68 0) scale(0.5)",
    muslo: "translate(0 0) scale(1)",
    pantorrilla: "translate(25 0) scale(0.8)",
  },
  femenino: {
    hombros: "translate(4 18) scale(1)",
    pecho: "translate(4 20) scale(1)",
    abdomen: "translate(4 6) scale(1)",
    cintura: "translate(4 0) scale(1)",
    cadera: "translate(4 -4) scale(1)",
    biceps: "translate(62 0) scale(0.5)",
    triceps: "translate(62 0) scale(0.5)",
    antebrazo: "translate(74 0) scale(0.5)",
    muslo: "translate(4 0) scale(1)",
    pantorrilla: "translate(28 0) scale(0.8)",
  },
};

// Ajuste fino para músculos que vienen de a par.
// Sirve para separar izquierda/derecha hacia afuera o hacia adentro sin tocar el grupo completo.
// translate(x y): x horizontal, y vertical.
// Ejemplo hacia afuera: left = translate(-4 0), right = translate(4 0).
const PAIRED_MUSCLE_TRANSFORMS_BY_SEX = {
  masculino: {
    biceps: {
      left: "translate(-80 120)",
      right: "translate(80 120)",
    },
    triceps: {
      left: "translate(-80 120)",
      right: "translate(80 120)",
    },
    antebrazo: {
      left: "translate(-100 200) rotate(0)",
      right: "translate(100 200) rotate(0)",
    },
    muslo: {
      left: "translate(-10 0)",
      right: "translate(10 0)",
    },
    pantorrilla: {
      left: "translate(-30 140)",
      right: "translate(30 140)",
    },
  },
  femenino: {
    biceps: {
      left: "translate(-50 120)",
      right: "translate(50 120)",
    },
    triceps: {
      left: "translate(-60 150)",
      right: "translate(60 150)",
    },
    antebrazo: {
      left: "translate(-60 180) rotate(3)",
      right: "translate(60 180) rotate(1)",
    },
    muslo: {
      left: "translate(-10 0)",
      right: "translate(10 0)",
    },
    pantorrilla: {
      left: "translate(-20 140)",
      right: "translate(20 140)",
    },
  },
} as const;


function BodyPart({
  groupId,
  state,
  activeGroup,
  children,
  onSelect,
  transform,
}: {
  groupId: BodyGroupId;
  state?: BodyGroupState;
  activeGroup: BodyGroupId;
  children: React.ReactNode;
  onSelect: (id: BodyGroupId) => void;
  transform?: string;
}) {
  const active = activeGroup === groupId;

  return (
    <g
      role="button"
      tabIndex={0}
      transform={transform}
      aria-label={`Seleccionar ${state?.label ?? groupId}`}
      onClick={() => onSelect(groupId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(groupId);
        }
      }}
      className="cursor-pointer outline-none transition-all duration-300 hover:opacity-95"
      style={{
        filter: active ? getActiveGlow(state) : undefined,
      }}
    >
      {children}
    </g>
  );
}

function BodyMapSvg({
  metrics,
  states,
  bodyView,
  activeGroup,
  onSelect,
  muted = false,
  heatmap = true,
}: {
  metrics: BodyMetrics;
  states: Map<BodyGroupId, BodyGroupState>;
  bodyView: BodyView;
  activeGroup: BodyGroupId;
  onSelect: (id: BodyGroupId) => void;
  muted?: boolean;
  heatmap?: boolean;
}) {
  const isBack = bodyView === "back";
  const model = humanPathModel(metrics);
  const visual = isBack ? getBackSilhouetteSrc(metrics) : getFrontSilhouetteSrc(metrics);
  const female = model.sex === "femenino";
  const sexKey = female ? "femenino" : "masculino";
  const muscleTransforms = MUSCLE_TRANSFORMS_BY_SEX[sexKey];
  const pairedTransforms = PAIRED_MUSCLE_TRANSFORMS_BY_SEX[sexKey];
  const fillFor = (id: BodyGroupId, fallback = "#38bdf8") =>
    activeGroup === id
      ? getActiveFill(states.get(id), fallback)
      : heatmap
        ? getColor(states.get(id), fallback)
        : fallback;
  const opacityFor = (id: BodyGroupId, fallback = 0.12) => {
    if (muted) return activeGroup === id ? 0.32 : 0.015;
    if (activeGroup === id) return heatmap ? 0.78 : 0.64;
    if (heatmap) return getPartOpacity(states.get(id), false) * 0.18;
    return 0.012;
  };
  const strokeFor = (id: BodyGroupId) =>
    activeGroup === id ? "rgba(240,253,255,0.95)" : heatmap ? "rgba(224,242,254,0.12)" : "rgba(224,242,254,0.03)";
  const strokeWidthFor = (id: BodyGroupId) => (activeGroup === id ? 2.4 : heatmap ? 0.55 : 0.35);
  const inactiveFilter = (id: BodyGroupId) =>
    activeGroup === id ? "drop-shadow(0 0 10px rgba(34,211,238,0.75))" : undefined;
  const overlayTransform = female
    ? "translate(-4 8) translate(130 258) scale(0.98 1.035) translate(-130 -258)"
    : "translate(-3 8) translate(130 258) scale(0.98 1.035) translate(-130 -258)";
  const shoulderRx = 60 * model.shoulder;
  const chestRx = 50 * model.chest;
  const waistRx = 42 * model.waist;
  const hipRx = 42 * model.hip;
  const abdomenRx = 33 * model.abdomen;


  return (
    <svg
      viewBox="0 0 260 560"
      className="h-full w-full select-none"
      role="img"
      aria-label={`Mapa corporal ${isBack ? "posterior" : "frontal"} ${female ? "femenino" : "masculino"}`}
    >
      <defs>
        <radialGradient id="gm-body-core-glow" cx="50%" cy="48%" r="62%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <filter id="gm-body-soft-glow" x="-30%" y="-20%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="gm-body-clip-front">
          <rect x="12" y="-10" width="236" height="565" rx="58" />
        </clipPath>
      </defs>

      <ellipse cx="130" cy="262" rx="100" ry="206" fill="url(#gm-body-core-glow)" opacity={muted ? 0.16 : 0.34} />
      <rect x="24" y="8" width="212" height="535" rx="38" fill="#071a32" opacity={0.88} stroke="#0f3554" strokeWidth="1" />

      <g clipPath="url(#gm-body-clip-front)">
        <image
          href={visual.src}
          x={female ? "6" : "4"}
          y={female ? "12" : "8"}
          width={female ? "247" : "250"}
          height="550"
          preserveAspectRatio="xMidYMin meet"
          opacity={muted ? 0.4 : 0.98}
          style={{
            filter: "drop-shadow(0 0 15px rgba(34,211,238,0.48)) drop-shadow(0 0 32px rgba(14,165,233,0.24))",
          }}
        />
      </g>

      <g transform={overlayTransform}>
      <BodyPart groupId="hombros" state={states.get("hombros")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms.hombros}>
        <path d={`M ${130 - shoulderRx} 110 C ${130 - shoulderRx + 10} 92, ${130 - 22} 89, 130 89 C ${130 + 22} 89, ${130 + shoulderRx - 10} 92, ${130 + shoulderRx} 110 C ${130 + shoulderRx - 8} 125, ${130 + 35} 129, ${130} 129 C ${130 - 35} 129, ${130 - shoulderRx + 8} 125, ${130 - shoulderRx} 110 Z`} fill={fillFor("hombros", "#60a5fa")} opacity={opacityFor("hombros", 0.12)} stroke={strokeFor("hombros")} strokeWidth={strokeWidthFor("hombros")} />
      </BodyPart>

      <BodyPart groupId={isBack ? "hombros" : "pecho"} state={states.get(isBack ? "hombros" : "pecho")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms[isBack ? "hombros" : "pecho"]}>
        {female && !isBack ? (
          <>
            <path d={`M 96 131 C 103 117, 118 112, 129 124 C 133 138, 126 148, 115 152 C 104 150, 98 142, 96 131 Z`} fill={fillFor("pecho", "#38bdf8")} opacity={opacityFor("pecho", 0.12)} stroke={strokeFor("pecho")} strokeWidth={strokeWidthFor("pecho")} />
            <path d={`M 131 124 C 142 112, 157 117, 164 131 C 162 142, 156 150, 145 152 C 134 148, 127 138, 131 124 Z`} fill={fillFor("pecho", "#38bdf8")} opacity={opacityFor("pecho", 0.12)} stroke={strokeFor("pecho")} strokeWidth={strokeWidthFor("pecho")} />
          </>
        ) : (
          <path d={`M ${130 - chestRx} 124 C ${130 - chestRx + 8} 108, ${130 - 28} 102, 130 102 C ${130 + 28} 102, ${130 + chestRx - 8} 108, ${130 + chestRx} 124 C ${130 + chestRx - 4} 150, ${130 + 28} 166, 130 166 C ${130 - 28} 166, ${130 - chestRx + 4} 150, ${130 - chestRx} 124 Z`} fill={fillFor(isBack ? "hombros" : "pecho", isBack ? "#60a5fa" : "#38bdf8")} opacity={opacityFor(isBack ? "hombros" : "pecho", 0.12)} stroke={strokeFor(isBack ? "hombros" : "pecho")} strokeWidth={strokeWidthFor(isBack ? "hombros" : "pecho")} />
        )}
      </BodyPart>

      <BodyPart groupId="abdomen" state={states.get("abdomen")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms.abdomen}>
        <path d={`M ${130 - abdomenRx} 165 C ${130 - abdomenRx - 4} 186, ${130 - 24} 216, 130 228 C ${130 + 24} 216, ${130 + abdomenRx + 4} 186, ${130 + abdomenRx} 165 C ${130 + 16} 152, ${130 - 16} 152, ${130 - abdomenRx} 165 Z`} fill={fillFor("abdomen", "#f59e0b")} opacity={opacityFor("abdomen", 0.12)} stroke={strokeFor("abdomen")} strokeWidth={strokeWidthFor("abdomen")} />
      </BodyPart>

      <BodyPart groupId="cintura" state={states.get("cintura")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms.cintura}>
        <path d={`M ${130 - waistRx} 228 C ${130 - waistRx + 6} 219, ${130 - 18} 214, 130 214 C ${130 + 18} 214, ${130 + waistRx - 6} 219, ${130 + waistRx} 228 C ${130 + waistRx - 2} 243, ${130 + 17} 248, 130 248 C ${130 - 17} 248, ${130 - waistRx + 2} 243, ${130 - waistRx} 228 Z`} fill={fillFor("cintura", "#22c55e")} opacity={opacityFor("cintura", 0.12)} stroke={strokeFor("cintura")} strokeWidth={strokeWidthFor("cintura")} />
      </BodyPart>

      <BodyPart groupId="cadera" state={states.get("cadera")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms.cadera}>
        <path d={`M ${130 - hipRx} 248 C ${130 - hipRx + 10} 238, ${130 - 28} 238, 130 240 C ${130 + 28} 238, ${130 + hipRx - 10} 238, ${130 + hipRx} 248 C ${130 + hipRx - 7} 276, ${130 + 30} 286, 130 286 C ${130 - 30} 286, ${130 - hipRx + 7} 276, ${130 - hipRx} 248 Z`} fill={fillFor("cadera", "#a78bfa")} opacity={opacityFor("cadera", 0.12)} stroke={strokeFor("cadera")} strokeWidth={strokeWidthFor("cadera")} />
      </BodyPart>

      <BodyPart groupId={isBack ? "triceps" : "biceps"} state={states.get(isBack ? "triceps" : "biceps")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms[isBack ? "triceps" : "biceps"]}>
        <g transform={isBack ? pairedTransforms.triceps.left : pairedTransforms.biceps.left}>
          <path d={`M 74 132 C 57 151, 52 181, 58 210 C 63 228, 71 241, 83 241 C 92 241, 95 225, 92 204 C 89 178, 87 155, 96 136 C 93 129, 86 126, 74 132 Z`} fill={fillFor(isBack ? "triceps" : "biceps", "#22d3ee")} opacity={opacityFor(isBack ? "triceps" : "biceps", 0.12)} stroke={strokeFor(isBack ? "triceps" : "biceps")} strokeWidth={strokeWidthFor(isBack ? "triceps" : "biceps")} />
        </g>
        <g transform={isBack ? pairedTransforms.triceps.right : pairedTransforms.biceps.right}>
          <path d={`M 186 136 C 195 155, 193 178, 190 204 C 187 225, 190 241, 199 241 C 211 241, 219 228, 224 210 C 230 181, 225 151, 208 132 C 196 126, 189 129, 186 136 Z`} fill={fillFor(isBack ? "triceps" : "biceps", "#22d3ee")} opacity={opacityFor(isBack ? "triceps" : "biceps", 0.12)} stroke={strokeFor(isBack ? "triceps" : "biceps")} strokeWidth={strokeWidthFor(isBack ? "triceps" : "biceps")} />
        </g>
      </BodyPart>

      <BodyPart groupId="antebrazo" state={states.get("antebrazo")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms.antebrazo}>
        <g transform={pairedTransforms.antebrazo.left}>
          <path d={`M 60 212 C 52 238, 49 268, 55 298 C 58 316, 67 335, 79 335 C 90 335, 92 318, 88 296 C 83 266, 82 241, 88 219 C 82 211, 74 208, 60 212 Z`} fill={fillFor("antebrazo", "#67e8f9")} opacity={opacityFor("antebrazo", 0.12)} stroke={strokeFor("antebrazo")} strokeWidth={strokeWidthFor("antebrazo")} />
        </g>
        <g transform={pairedTransforms.antebrazo.right}>
          <path d={`M 172 219 C 178 241, 177 266, 172 296 C 168 318, 170 335, 181 335 C 193 335, 202 316, 205 298 C 211 268, 208 238, 200 212 C 186 208, 178 211, 172 219 Z`} fill={fillFor("antebrazo", "#67e8f9")} opacity={opacityFor("antebrazo", 0.12)} stroke={strokeFor("antebrazo")} strokeWidth={strokeWidthFor("antebrazo")} />
        </g>
      </BodyPart>

      <BodyPart groupId="muslo" state={states.get("muslo")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms.muslo}>
        <g transform={pairedTransforms.muslo.left}>
          <path d={`M 96 276 C 83 301, 83 335, 90 370 C 94 390, 101 402, 110 400 C 120 398, 122 382, 121 360 C 120 332, 123 306, 128 286 C 120 278, 109 274, 96 276 Z`} fill={fillFor("muslo", "#14b8a6")} opacity={opacityFor("muslo", 0.10)} stroke={strokeFor("muslo")} strokeWidth={strokeWidthFor("muslo")} />
        </g>
        <g transform={pairedTransforms.muslo.right}>
          <path d={`M 132 286 C 137 306, 140 332, 139 360 C 138 382, 140 398, 150 400 C 159 402, 166 390, 170 370 C 177 335, 177 301, 164 276 C 151 274, 140 278, 132 286 Z`} fill={fillFor("muslo", "#14b8a6")} opacity={opacityFor("muslo", 0.10)} stroke={strokeFor("muslo")} strokeWidth={strokeWidthFor("muslo")} />
        </g>
      </BodyPart>

      <BodyPart groupId="pantorrilla" state={states.get("pantorrilla")} activeGroup={activeGroup} onSelect={onSelect} transform={muscleTransforms.pantorrilla}>
        <g transform={pairedTransforms.pantorrilla.left}>
          <path d={`M 96 373 C 90 394, 91 424, 99 450 C 103 462, 110 468, 116 464 C 122 460, 122 448, 120 434 C 117 412, 118 392, 122 378 C 116 372, 106 370, 96 373 Z`} fill={fillFor("pantorrilla", "#06b6d4")} opacity={opacityFor("pantorrilla", 0.10)} stroke={strokeFor("pantorrilla")} strokeWidth={strokeWidthFor("pantorrilla")} />
        </g>
        <g transform={pairedTransforms.pantorrilla.right}>
          <path d={`M 138 378 C 142 392, 143 412, 140 434 C 138 448, 138 460, 144 464 C 150 468, 157 462, 161 450 C 169 424, 170 394, 164 373 C 154 370, 144 372, 138 378 Z`} fill={fillFor("pantorrilla", "#06b6d4")} opacity={opacityFor("pantorrilla", 0.10)} stroke={strokeFor("pantorrilla")} strokeWidth={strokeWidthFor("pantorrilla")} />
        </g>
      </BodyPart>

      </g>

      <text x="130" y="510" textAnchor="middle" className="fill-slate-300 text-[11px]">
        {`${isBack ? "Vista posterior" : "Vista frontal"} · ${female ? "femenina" : "masculina"}`}
      </text>
    </svg>
  );
}

function StudioStat({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border bg-card/90 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
        </div>
        <div className="rounded-xl bg-[#02a8e1]/10 p-2 text-[#02a8e1]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function GroupPill({
  state,
  active,
  onClick,
}: {
  state: BodyGroupState;
  active: boolean;
  onClick: () => void;
}) {
  const color = getColor(state);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active ? "border-[#02a8e1] bg-[#02a8e1]/10 text-[#036985] dark:text-sky-200" : "bg-background text-muted-foreground hover:bg-muted/60"
      }`}
    >
      <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {state.label}
    </button>
  );
}

export default function EvolucionFisicaBeforeAfterStudio({
  rows,
  socioNombre = "Socio",
}: EvolucionFisicaBeforeAfterStudioProps) {
  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [rows]
  );

  const initialIndex = useMemo(() => {
    const index = orderedRows.findIndex((row) => row.es_registro_inicial);
    return index >= 0 ? index : 0;
  }, [orderedRows]);

  const [beforeIndex, setBeforeIndex] = useState(initialIndex);
  const [afterIndex, setAfterIndex] = useState(Math.max(orderedRows.length - 1, 0));
  const [mode, setMode] = useState<ViewMode>("slider");
  const [bodyView, setBodyView] = useState<BodyView>("front");
  const [slider, setSlider] = useState(52);
  const [activeGroup, setActiveGroup] = useState<BodyGroupId>("cintura");

  useEffect(() => {
    setBeforeIndex(initialIndex);
    setAfterIndex(Math.max(orderedRows.length - 1, 0));
  }, [initialIndex, orderedRows.length]);

  if (orderedRows.length < 2) {
    return (
      <Card className="rounded-2xl border bg-card text-card-foreground shadow-sm">
        <CardContent className="p-6 text-sm text-muted-foreground">
          El estudio visual antes/después se activará cuando existan al menos dos registros de evolución física.
        </CardContent>
      </Card>
    );
  }

  const beforeRow = orderedRows[clamp(beforeIndex, 0, orderedRows.length - 1)] || orderedRows[0];
  const afterRow = orderedRows[clamp(afterIndex, 0, orderedRows.length - 1)] || orderedRows[orderedRows.length - 1];
  const beforeMetricsBase = getMetrics(beforeRow);
  const afterMetricsBase = getMetrics(afterRow);
  const referenceSex = resolveReferenceSex({
    rows: orderedRows,
    beforeRow,
    afterRow,
    beforeMetrics: beforeMetricsBase,
    afterMetrics: afterMetricsBase,
    socioNombre,
  });
  const beforeMetrics = { ...beforeMetricsBase, sexoReferencia: referenceSex };
  const afterMetrics = { ...afterMetricsBase, sexoReferencia: referenceSex };
  const groupStates = buildGroupStates(beforeMetrics, afterMetrics);
  const groupMap = new Map(groupStates.map((state) => [state.id, state]));
  const activeState = groupMap.get(activeGroup) || groupStates[0];
  const compositeScore = getCompositeScore(groupStates);
  const improvedCount = groupStates.filter((state) => state.tone === "improved").length;
  const regressedCount = groupStates.filter((state) => state.tone === "regressed").length;
  const summaryText = getSummaryText(groupStates);
  const scoreLabel = compositeScore > 0.08 ? "Favorable" : compositeScore < -0.08 ? "A revisar" : "Estable";
  const ScoreIcon = compositeScore >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      <CardHeader className="space-y-3 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-[#063247] p-5 text-white">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-200">
              <Sparkles className="h-4 w-4" />
              Estudio visual antes/después
            </p>
            <h3 className="mt-2 text-2xl font-bold">Mapa corporal interactivo de {socioNombre}</h3>
            <p className="mt-2 max-w-4xl text-sm text-cyan-50/80">
              Silueta SVG propia, heatmap por grupos corporales y comparación entre dos mediciones. Inspirado en patrones benchmark, sin copiar assets ni componentes externos.
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-background/10 p-3 text-center backdrop-blur">
            <div>
              <p className="text-lg font-bold">{improvedCount}</p>
              <p className="text-[11px] text-cyan-100/80">mejoras</p>
            </div>
            <div>
              <p className="text-lg font-bold">{regressedCount}</p>
              <p className="text-[11px] text-cyan-100/80">alertas</p>
            </div>
            <div>
              <p className="text-lg font-bold">{scoreLabel}</p>
              <p className="text-[11px] text-cyan-100/80">estado</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1.5">
            <label htmlFor="gm-evo-before-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Medición antes
            </label>
            <select
              id="gm-evo-before-date"
              value={beforeIndex}
              onChange={(event) => setBeforeIndex(Number(event.target.value))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {orderedRows.map((row, index) => (
                <option key={`before-${rowKey(row, index)}`} value={index}>
                  {formatDate(row.fecha)} · {formatNumber(row.peso, " kg")} · cintura {formatNumber(row.cintura, " cm")}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gm-evo-after-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Medición después
            </label>
            <select
              id="gm-evo-after-date"
              value={afterIndex}
              onChange={(event) => setAfterIndex(Number(event.target.value))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {orderedRows.map((row, index) => (
                <option key={`after-${rowKey(row, index)}`} value={index}>
                  {formatDate(row.fecha)} · {formatNumber(row.peso, " kg")} · cintura {formatNumber(row.cintura, " cm")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {bodyViews.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={bodyView === item.id ? "default" : "outline"}
                onClick={() => setBodyView(item.id)}
                className={bodyView === item.id ? "bg-[#02a8e1] hover:bg-[#0288b1]" : ""}
              >
                <Eye className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {viewModes.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              variant={mode === id ? "default" : "outline"}
              onClick={() => setMode(id)}
              className={mode === id ? "bg-[#02a8e1] hover:bg-[#0288b1]" : ""}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.95fr)_1.05fr]">
          <div className="space-y-4 rounded-3xl border bg-slate-950 p-4 shadow-inner">
            <div className="flex items-center justify-between gap-3 text-xs text-cyan-100">
              <span>Antes · {formatShortDate(beforeRow.fecha)}</span>
              <span>Después · {formatShortDate(afterRow.fecha)}</span>
            </div>

            <div
              data-evolucion-before-after-panel="true"
              data-body-view={bodyView}
              data-view-mode={mode}
              data-slider={slider}
              data-before-label={`Antes · ${formatShortDate(beforeRow.fecha)}`}
              data-after-label={`Después · ${formatShortDate(afterRow.fecha)}`}
              data-score-label={scoreLabel}
              className="relative mx-auto h-[560px] w-full max-w-[360px] overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.20),rgba(2,6,23,0.96)_58%)]"
            >
              {mode === "slider" ? (
                <>
                  <div data-evolucion-map-layer="before" className="absolute inset-0 p-4 opacity-75">
                    <BodyMapSvg
                      metrics={beforeMetrics}
                      states={groupMap}
                      bodyView={bodyView}
                      activeGroup={activeGroup}
                      onSelect={setActiveGroup}
                      muted
                    />
                  </div>
                  <div
                    data-evolucion-map-layer="after"
                    className="absolute inset-0 p-4"
                    style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
                  >
                    <BodyMapSvg
                      metrics={afterMetrics}
                      states={groupMap}
                      bodyView={bodyView}
                      activeGroup={activeGroup}
                      onSelect={setActiveGroup}
                    />
                  </div>
                  <div
                    className="pointer-events-none absolute inset-y-4 w-0.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.95)]"
                    style={{ left: `${slider}%` }}
                  />
                </>
              ) : mode === "overlay" ? (
                <>
                  <div data-evolucion-map-layer="before" className="absolute inset-0 p-4 opacity-45 blur-[0.2px]">
                    <BodyMapSvg
                      metrics={beforeMetrics}
                      states={groupMap}
                      bodyView={bodyView}
                      activeGroup={activeGroup}
                      onSelect={setActiveGroup}
                      muted
                      heatmap={false}
                    />
                  </div>
                  <div data-evolucion-map-layer="after" className="absolute inset-0 p-4 mix-blend-screen">
                    <BodyMapSvg
                      metrics={afterMetrics}
                      states={groupMap}
                      bodyView={bodyView}
                      activeGroup={activeGroup}
                      onSelect={setActiveGroup}
                    />
                  </div>
                </>
              ) : (
                <div data-evolucion-map-layer="heatmap" className="absolute inset-0 p-4">
                  <BodyMapSvg
                    metrics={afterMetrics}
                    states={groupMap}
                    bodyView={bodyView}
                    activeGroup={activeGroup}
                    onSelect={setActiveGroup}
                  />
                </div>
              )}
            </div>

            {mode === "slider" && (
              <div className="rounded-2xl border border-cyan-300/20 bg-background/10 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-cyan-100">
                  <span>Antes</span>
                  <span>{slider}%</span>
                  <span>Después</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slider}
                  onChange={(event) => setSlider(Number(event.target.value))}
                  className="w-full accent-cyan-300"
                  aria-label="Comparador antes después"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StudioStat
                label="Peso"
                value={formatSigned(getDelta(afterMetrics.peso, beforeMetrics.peso), " kg")}
                helper={`${formatNumber(beforeMetrics.peso, " kg")} → ${formatNumber(afterMetrics.peso, " kg")}`}
                icon={Scale}
              />
              <StudioStat
                label="Cintura"
                value={formatSigned(getDelta(afterMetrics.cintura, beforeMetrics.cintura), " cm")}
                helper={`${formatNumber(beforeMetrics.cintura, " cm")} → ${formatNumber(afterMetrics.cintura, " cm")}`}
                icon={Ruler}
              />
              <StudioStat
                label="Masa muscular"
                value={formatSigned(getDelta(afterMetrics.masaMuscular, beforeMetrics.masaMuscular), " kg")}
                helper={`${formatNumber(beforeMetrics.masaMuscular, " kg")} → ${formatNumber(afterMetrics.masaMuscular, " kg")}`}
                icon={Dumbbell}
              />
              <StudioStat
                label="Lectura"
                value={scoreLabel}
                helper={summaryText}
                icon={ScoreIcon}
              />
            </div>

            <div className="rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#02a8e1]">Grupo seleccionado</p>
                  <h4 className="mt-1 text-xl font-bold text-foreground">{activeState.label}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{activeState.description}</p>
                </div>
                <div
                  className="rounded-2xl px-3 py-2 text-sm font-bold"
                  style={{ backgroundColor: getSoftColor(activeState), color: getColor(activeState) }}
                >
                  {activeState.tone === "improved"
                    ? "Mejora"
                    : activeState.tone === "regressed"
                    ? "Revisar"
                    : activeState.tone === "stable"
                    ? "Estable"
                    : "Sin dato"}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Antes</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatNumber(activeState.before, activeState.before === null ? "" : ` ${activeState.unit}`)}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Después</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatNumber(activeState.after, activeState.after === null ? "" : ` ${activeState.unit}`)}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Cambio</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatSigned(activeState.delta, activeState.delta === null ? "" : ` ${activeState.unit}`)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <UserRound className="h-4 w-4 text-[#02a8e1]" />
                Mapa de grupos corporales
              </div>
              <div className="flex flex-wrap gap-2">
                {groupStates.map((state) => (
                  <GroupPill
                    key={state.id}
                    state={state}
                    active={activeGroup === state.id}
                    onClick={() => setActiveGroup(state.id)}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <div className="rounded-xl border bg-card p-3">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  Verde: evolución favorable según objetivo de la métrica.
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-500" />
                  Naranja: revisar contexto, adherencia o plan.
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />
                  Celeste: cambio estable o métrica neutral.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="font-semibold">Representación visual estimativa</p>
              <p className="mt-1">
                La silueta y el heatmap son una guía visual basada en mediciones cargadas. No reemplaza evaluación médica, antropométrica profesional ni criterio del entrenador.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

