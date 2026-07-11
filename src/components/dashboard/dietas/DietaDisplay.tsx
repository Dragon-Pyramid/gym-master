"use client";

import { useEffect, useMemo, useState } from "react";
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
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  Utensils,
} from "lucide-react";
import { descargarDietaPdf } from "@/utils/dietaPdf";
import { formatFrontendDate } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";
import {
  translateDietGoal,
  translateDietPlanName,
  translateDietProgressLabel,
  translateFoodItem,
  translateMealHint,
  translateMealTitle,
} from "@/utils/dietaI18nPresentation";

type PlanBlock = {
  key: string;
  title: string;
  items: string[];
};

type DietaFollowupState = {
  completedMeals: string[];
  updatedAt?: string;
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
  if (
    normalized.includes("media manana") ||
    normalized.includes("colacion manana")
  ) {
    return "colacion media manana";
  }
  if (normalized.includes("almuerzo")) return "almuerzo";
  if (normalized.includes("siesta")) return "colacion siesta";
  if (normalized.includes("merienda")) return "merienda";
  if (normalized.includes("tarde")) return "colacion tarde";
  if (normalized.includes("cena")) return "cena";

  return normalized;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFollowupStorageKey(dietaId: string | number) {
  return `gym-master:dieta-followup:${dietaId}:${getLocalDateKey()}`;
}

function getBlockCompletionId(block: PlanBlock, index: number) {
  return `${block.key || normalizeMealTitle(block.title) || "comida"}-${index}`;
}

function toReadableText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
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
        items: buildItemsFromUnknown(
          item?.items || item?.alimentos || item?.descripcion || item
        ),
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
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const plan = useMemo(() => parsePlan(dieta.observaciones), [dieta.observaciones]);
  const duracion = calculateDays(dieta.fecha_inicio, dieta.fecha_fin);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeMealIndex, setActiveMealIndex] = useState(0);
  const [completedMeals, setCompletedMeals] = useState<string[]>([]);
  const [followupLoaded, setFollowupLoaded] = useState(false);
  const socioNombre =
    dieta.socio?.nombre_completo || dieta.socio_id || tx("Socio no disponible", "Member not available");
  const activeBlock = plan.blocks[activeMealIndex] ?? plan.blocks[0];
  const progressLabel = getPlanProgressLabel(dieta.fecha_inicio, dieta.fecha_fin);
  const mealCompletionIds = useMemo(
    () => plan.blocks.map((block, index) => getBlockCompletionId(block, index)),
    [plan.blocks]
  );
  const activeMealCompletionId = activeBlock
    ? getBlockCompletionId(activeBlock, activeMealIndex)
    : null;
  const completedMealsCount = completedMeals.filter((mealId) =>
    mealCompletionIds.includes(mealId)
  ).length;
  const dailyProgressPercent = plan.blocks.length
    ? Math.round((completedMealsCount / plan.blocks.length) * 100)
    : 0;
  const currentMealCompleted = activeMealCompletionId
    ? completedMeals.includes(activeMealCompletionId)
    : false;
  const followupStorageKey = useMemo(
    () => getFollowupStorageKey(dieta.id),
    [dieta.id]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(followupStorageKey);
      const parsed = raw ? (JSON.parse(raw) as DietaFollowupState) : null;
      const validMeals = Array.isArray(parsed?.completedMeals)
        ? parsed.completedMeals.filter((mealId) => mealCompletionIds.includes(mealId))
        : [];
      setCompletedMeals(validMeals);
    } catch {
      setCompletedMeals([]);
    } finally {
      setFollowupLoaded(true);
    }
  }, [followupStorageKey, mealCompletionIds]);

  useEffect(() => {
    if (!followupLoaded || typeof window === "undefined") return;

    const payload: DietaFollowupState = {
      completedMeals,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(followupStorageKey, JSON.stringify(payload));
  }, [completedMeals, followupLoaded, followupStorageKey]);

  const toggleMealCompletion = (mealId: string) => {
    setCompletedMeals((current) =>
      current.includes(mealId)
        ? current.filter((item) => item !== mealId)
        : [...current, mealId]
    );
  };

  const resetDailyFollowup = () => {
    setCompletedMeals([]);
  };

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
      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm print:hidden dark:border-sky-900/50 dark:from-sky-950/40 dark:via-slate-950 dark:to-emerald-950/30 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 ring-1 ring-sky-100 dark:bg-sky-900/60 dark:text-sky-100 dark:ring-sky-800">
              <Utensils className="h-3.5 w-3.5" /> {tx("Mi dieta", "My diet")}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-slate-900 dark:text-slate-50 md:text-3xl">
                {translateDietPlanName(dieta.nombre_plan || "Plan alimentario", isEnglish)}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {tx("Seguí tu plan comida por comida. Ante dudas, restricciones o malestar, consultá al entrenador o profesional responsable.", "Follow your plan meal by meal. If you have questions, restrictions, or discomfort, consult the trainer or responsible professional.")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isEnglish && backLabel === "Volver" ? "Back" : backLabel}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDescargarPdf}
              disabled={pdfLoading}
              className="w-full border-sky-200 bg-white text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-950 dark:text-sky-100 dark:hover:bg-sky-950/40 sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {pdfLoading ? tx("Generando...", "Generating...") : tx("Descargar PDF", "Download PDF")}
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-100 dark:ring-emerald-800">
              {translateDietProgressLabel(progressLabel, isEnglish)}
            </span>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 dark:bg-sky-900/50 dark:text-sky-100 dark:ring-sky-800">
              {plan.blocks.length} {tx("comidas registradas", "registered meals")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border bg-muted/30 p-3 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Target className="h-4 w-4" /> {tx("Objetivo", "Goal")}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {translateDietGoal(dieta.objetivo || "No definido", isEnglish)}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-3 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-4 w-4" /> {tx("Inicio", "Start")}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatDate(dieta.fecha_inicio)}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-3 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-4 w-4" /> {tx("Fin", "End")}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatDate(dieta.fecha_fin)}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-3 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-4 w-4" /> {tx("Duración", "Duration")}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {duracion > 0 ? `${duracion} ${tx("días", "days")}` : tx("No calculable", "Not calculable")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {plan.blocks.length > 0 ? (
        <Card className="overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-950">
          <CardContent className="space-y-4 p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-100 dark:ring-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {tx("Seguimiento de hoy", "Today's follow-up")}
                </div>
                <h2 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-50">
                  {completedMealsCount} {tx("de", "of")} {plan.blocks.length} {tx("comidas revisadas", "meals reviewed")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {tx("Marcá las comidas a medida que cumplís el plan. Este seguimiento queda guardado en este dispositivo para el día actual.", "Mark meals as you complete the plan. This follow-up is saved on this device for the current day.")}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-center dark:border-emerald-900/60 dark:bg-slate-950">
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-200">
                  {dailyProgressPercent}%
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/70 dark:text-emerald-200/70">
                  {tx("avance diario", "daily progress")}
                </p>
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-300"
                style={{ width: `${dailyProgressPercent}%` }}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {activeMealCompletionId ? (
                <Button
                  type="button"
                  onClick={() => toggleMealCompletion(activeMealCompletionId)}
                  className="w-full rounded-2xl"
                  variant={currentMealCompleted ? "outline" : "default"}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {currentMealCompleted
                    ? tx("Reabrir comida actual", "Reopen current meal")
                    : tx("Marcar comida actual", "Mark current meal")}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={resetDailyFollowup}
                className="w-full rounded-2xl"
                disabled={completedMealsCount === 0}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {tx("Reiniciar seguimiento", "Restart follow-up")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {plan.blocks.length > 0 ? (
        <Card className="overflow-hidden border-sky-100 shadow-sm dark:border-sky-900/50">
          <CardHeader className="space-y-3 p-4 md:p-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-sky-600" />
              {tx("Comidas del día", "Meals of the day")}
            </CardTitle>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              {plan.blocks.map((block, index) => {
                const mealId = getBlockCompletionId(block, index);
                const isCompleted = completedMeals.includes(mealId);

                return (
                  <button
                    key={`${block.key}-${index}`}
                    type="button"
                    onClick={() => setActiveMealIndex(index)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
                      index === activeMealIndex
                        ? "bg-sky-600 text-white shadow-sm"
                        : isCompleted
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    {translateMealTitle(block.title, isEnglish)}
                  </button>
                );
              })}
            </div>
          </CardHeader>
          {activeBlock ? (
            <CardContent className="p-4 pt-0 md:p-5 md:pt-0">
              <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900/50 dark:bg-sky-950/20">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                      {translateMealTitle(activeBlock.title, isEnglish)}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {translateMealHint(activeBlock.key, isEnglish) ||
                        tx("Revisá esta comida y respetá las indicaciones cargadas.", "Review this meal and follow the loaded instructions.")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100 dark:bg-slate-950 dark:text-sky-100 dark:ring-sky-900">
                      {activeBlock.items.length} {tx("ítems", "items")}
                    </span>
                    {currentMealCompleted ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-100 dark:ring-emerald-800">
                        {tx("Completada", "Completed")}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ul className="space-y-2">
                  {activeBlock.items.map((item, itemIndex) => (
                    <li
                      key={`${activeBlock.key}-${itemIndex}`}
                      className="flex gap-2 rounded-2xl bg-white/85 p-3 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-100 dark:bg-slate-950/90 dark:text-slate-200 dark:ring-slate-800"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{translateFoodItem(item, isEnglish)}</span>
                    </li>
                  ))}
                </ul>
                {activeMealCompletionId ? (
                  <Button
                    type="button"
                    variant={currentMealCompleted ? "outline" : "default"}
                    onClick={() => toggleMealCompletion(activeMealCompletionId)}
                    className="mt-4 w-full rounded-2xl"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {currentMealCompleted
                      ? tx("Reabrir esta comida", "Reopen this meal")
                      : tx("Marcar esta comida como cumplida", "Mark this meal as completed")}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <CardHeader className="p-4 md:p-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            {tx("Detalle completo del plan", "Full plan detail")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 md:p-5 md:pt-0">
          {plan.blocks.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {plan.blocks.map((block, index) => {
                const mealId = getBlockCompletionId(block, index);
                const isCompleted = completedMeals.includes(mealId);

                return (
                  <div
                    key={`${translateMealTitle(block.title, isEnglish)}-${index}`}
                    className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
                        <Utensils className="h-4 w-4" />
                        {translateMealTitle(block.title, isEnglish)}
                      </h3>
                      {isCompleted ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-100 dark:ring-emerald-800">
                          {tx("cumplida", "completed")}
                        </span>
                      ) : null}
                    </div>
                    <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{translateFoodItem(item, isEnglish)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : plan.raw ? (
            <div className="rounded-2xl border bg-muted/30 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {isEnglish ? plan.raw : plan.raw}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              {tx("Esta dieta no tiene detalle alimentario registrado todavía.", "This diet has no meal detail registered yet.")}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 print:hidden dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="mb-1 flex items-center gap-2 font-bold">
          <ShieldAlert className="h-4 w-4" />
          {tx("Recordatorio importante", "Important reminder")}
        </div>
        <p>
          {tx("Esta información es una guía de acompañamiento para tu entrenamiento. No reemplaza una consulta médica o nutricional profesional. Si tenés una condición clínica, dolor, alergias o malestar, avisá al gimnasio antes de continuar.", "This information is a support guide for your training. It does not replace professional medical or nutritional advice. If you have a clinical condition, pain, allergies, or discomfort, notify the gym before continuing.")}
        </p>
      </div>
    </div>
  );
}
