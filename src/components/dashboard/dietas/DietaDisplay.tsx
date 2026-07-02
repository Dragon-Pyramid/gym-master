"use client";

import { useMemo, useState } from "react";
import { Dieta } from "@/interfaces/dieta.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Info,
  ShieldAlert,
  Sparkles,
  Target,
  Utensils,
} from "lucide-react";
import { descargarDietaPdf } from "@/utils/dietaPdf";
import { formatFrontendDate } from "@/utils/dateFormat";

type PlanBlock = {
  key: string;
  title: string;
  items: string[];
};

const MEAL_ORDER = [
  "desayuno",
  "colacion media manana",
  "almuerzo",
  "colacion siesta",
  "merienda",
  "colacion tarde",
  "cena",
];

const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  "colacion media manana": "Colación media mañana",
  almuerzo: "Almuerzo",
  "colacion siesta": "Colación siesta",
  merienda: "Merienda",
  "colacion tarde": "Colación tarde",
  cena: "Cena",
};

const MEAL_HINTS: Record<string, string> = {
  desayuno: "Primer combustible del día",
  "colacion media manana": "Mantiene energía entre comidas",
  almuerzo: "Comida fuerte del día",
  "colacion siesta": "Apoyo liviano para la tarde",
  merienda: "Energía antes o después de entrenar",
  "colacion tarde": "Controla hambre y ansiedad",
  cena: "Cierre del día sin excesos",
};

function normalizeMealTitle(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (normalized.includes("desayuno")) return "desayuno";
  if (normalized.includes("media manana") || normalized.includes("colacion manana")) {
    return "colacion media manana";
  }
  if (normalized.includes("almuerzo")) return "almuerzo";
  if (normalized.includes("siesta")) return "colacion siesta";
  if (normalized.includes("merienda")) return "merienda";
  if (normalized.includes("tarde")) return "colacion tarde";
  if (normalized.includes("cena")) return "cena";

  return normalized;
}

function toReadableText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    return value.map(toReadableText).filter(Boolean).join(" · ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred =
      record.descripcion ||
      record.detalle ||
      record.indicacion ||
      record.observacion ||
      record.alimento ||
      record.comida ||
      record.items;

    if (preferred) return toReadableText(preferred);

    return Object.entries(record)
      .map(([key, itemValue]) => `${key}: ${toReadableText(itemValue)}`)
      .filter((item) => item.trim() !== ":")
      .join(" · ");
  }

  return String(value);
}

function buildItemsFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(toReadableText).filter(Boolean);
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const directItems = record.items || record.alimentos || record.opciones;

    if (Array.isArray(directItems)) {
      const items = directItems.map(toReadableText).filter(Boolean);
      const extra = [record.descripcion, record.detalle, record.observacion]
        .map(toReadableText)
        .filter(Boolean);
      return [...extra, ...items];
    }
  }

  const text = toReadableText(value);
  return text ? [text] : [];
}

function orderPlanBlocks(blocks: PlanBlock[]) {
  return blocks
    .map((block, index) => {
      const normalizedKey = normalizeMealTitle(block.title);
      const order = MEAL_ORDER.indexOf(normalizedKey);

      return {
        ...block,
        key: normalizedKey || block.key || `comida-${index + 1}`,
        title: MEAL_LABELS[normalizedKey] || block.title,
        __order: order === -1 ? 999 + index : order,
      };
    })
    .sort((a, b) => a.__order - b.__order)
    .map(({ __order, ...block }) => block);
}

interface DietaDisplayProps {
  dieta: Dieta;
  onBack?: () => void;
  backLabel?: string;
}

function formatDate(date?: string) {
  if (!date) return "No disponible";

  return formatFrontendDate(date);
}

function calculateDays(start?: string, end?: string) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function parsePlan(observaciones?: string): { blocks: PlanBlock[]; raw?: string } {
  if (!observaciones?.trim()) return { blocks: [] };

  try {
    const parsed = JSON.parse(observaciones);

    if (Array.isArray(parsed)) {
      const blocks = parsed.map((item, index) => ({
        key: `comida-${index + 1}`,
        title: item?.title || item?.titulo || item?.comida || `Comida ${index + 1}`,
        items: buildItemsFromUnknown(item?.items || item?.alimentos || item?.descripcion || item),
      }));
      return { blocks: orderPlanBlocks(blocks) };
    }

    if (typeof parsed === "object" && parsed !== null) {
      const blocks = Object.entries(parsed).map(([key, value], index) => ({
        key: key || `comida-${index + 1}`,
        title: key,
        items: buildItemsFromUnknown(value),
      }));

      return { blocks: orderPlanBlocks(blocks) };
    }
  } catch {
    return { blocks: [], raw: observaciones };
  }

  return { blocks: [], raw: observaciones };
}

function getPlanProgressLabel(start?: string, end?: string) {
  if (!start || !end) return "Seguimiento manual";

  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Seguimiento manual";
  }

  if (now < startDate) return "Plan próximo";
  if (now > endDate) return "Plan finalizado";
  return "Plan vigente";
}

export default function DietaDisplay({
  dieta,
  onBack,
  backLabel = "Volver",
}: DietaDisplayProps) {
  const plan = useMemo(() => parsePlan(dieta.observaciones), [dieta.observaciones]);
  const duracion = calculateDays(dieta.fecha_inicio, dieta.fecha_fin);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeMealIndex, setActiveMealIndex] = useState(0);
  const socioNombre = dieta.socio?.nombre_completo || dieta.socio_id || "Socio no disponible";
  const activeBlock = plan.blocks[activeMealIndex] ?? plan.blocks[0];
  const progressLabel = getPlanProgressLabel(dieta.fecha_inicio, dieta.fecha_fin);

  const handleDescargarPdf = async () => {
    try {
      setPdfLoading(true);
      await descargarDietaPdf({ dieta, socioNombre });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 print:p-0 md:space-y-6 md:pb-0">
      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm print:hidden md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 ring-1 ring-sky-100">
              <Utensils className="h-3.5 w-3.5" /> Mi dieta
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-slate-900 md:text-3xl">
                {dieta.nombre_plan || "Plan alimentario"}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Seguí tu plan comida por comida. Ante dudas, restricciones o malestar, consultá al entrenador o profesional responsable.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDescargarPdf}
              disabled={pdfLoading}
              className="w-full border-sky-200 bg-white text-sky-700 hover:bg-sky-50 sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {pdfLoading ? "Generando..." : "Descargar PDF"}
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {progressLabel}
            </span>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
              {plan.blocks.length} comidas registradas
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Target className="h-4 w-4" /> Objetivo
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {dieta.objetivo || "No definido"}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-4 w-4" /> Inicio
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(dieta.fecha_inicio)}</p>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-4 w-4" /> Fin
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(dieta.fecha_fin)}</p>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-4 w-4" /> Duración
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {duracion > 0 ? `${duracion} días` : "No calculable"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {plan.blocks.length > 0 ? (
        <Card className="overflow-hidden border-sky-100 shadow-sm">
          <CardHeader className="space-y-3 p-4 md:p-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-sky-600" />
              Comidas del día
            </CardTitle>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              {plan.blocks.map((block, index) => (
                <button
                  key={`${block.key}-${index}`}
                  type="button"
                  onClick={() => setActiveMealIndex(index)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    index === activeMealIndex
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {block.title}
                </button>
              ))}
            </div>
          </CardHeader>
          {activeBlock ? (
            <CardContent className="p-4 pt-0 md:p-5 md:pt-0">
              <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{activeBlock.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {MEAL_HINTS[activeBlock.key] || "Revisá esta comida y respetá las indicaciones cargadas."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
                    {activeBlock.items.length} ítems
                  </span>
                </div>
                <ul className="space-y-2">
                  {activeBlock.items.map((item, itemIndex) => (
                    <li
                      key={`${activeBlock.key}-${itemIndex}`}
                      className="flex gap-2 rounded-2xl bg-white/85 p-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-100"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <CardHeader className="p-4 md:p-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Detalle completo del plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 md:p-5 md:pt-0">
          {plan.blocks.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {plan.blocks.map((block, index) => (
                <div key={`${block.title}-${index}`} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
                    <Utensils className="h-4 w-4" />
                    {block.title}
                  </h3>
                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : plan.raw ? (
            <div className="rounded-2xl border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {plan.raw}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Esta dieta no tiene detalle alimentario registrado todavía.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 print:hidden">
        <div className="mb-1 flex items-center gap-2 font-bold">
          <ShieldAlert className="h-4 w-4" />
          Recordatorio importante
        </div>
        <p>
          Esta información es una guía de acompañamiento para tu entrenamiento. No reemplaza una consulta médica o nutricional profesional. Si tenés una condición clínica, dolor, alergias o malestar, avisá al gimnasio antes de continuar.
        </p>
      </div>
    </div>
  );
}
