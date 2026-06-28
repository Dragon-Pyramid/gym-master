"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Percent,
  Ruler,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";
import { getEvolucionesFisicas } from "@/services/evolucionSocioClient";
import { formatFrontendDate } from "@/utils/dateFormat";

type DeltaDirection = "lower" | "higher" | "neutral";

interface ProgressMetric {
  label: string;
  current: string;
  initial: string;
  delta: number | null;
  suffix: string;
  direction: DeltaDirection;
  icon: typeof Activity;
}

const toNumber = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(value);
};

const delta = (current?: number | null, initial?: number | null) => {
  const currentValue = toNumber(current);
  const initialValue = toNumber(initial);

  if (currentValue === null || initialValue === null) return null;

  return Number((currentValue - initialValue).toFixed(2));
};

const formatNumber = (
  value?: number | null,
  suffix = "",
  maximumFractionDigits = 1
) => {
  const numberValue = toNumber(value);

  if (numberValue === null) return "-";

  return `${numberValue.toLocaleString("es-AR", {
    maximumFractionDigits,
  })}${suffix}`;
};

const formatSigned = (value: number | null, suffix = "") => {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${formatNumber(value, suffix)}`;
};

const getOrderedRows = (rows: EvolucionSocio[]) =>
  [...rows].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

const isImprovement = (value: number | null, direction: DeltaDirection) => {
  if (value === null || value === 0 || direction === "neutral") return null;
  return direction === "lower" ? value < 0 : value > 0;
};

const getDeltaClassName = (value: number | null, direction: DeltaDirection) => {
  const improved = isImprovement(value, direction);

  if (improved === null) return "bg-slate-100 text-slate-700";
  return improved
    ? "bg-emerald-100 text-emerald-800"
    : "bg-amber-100 text-amber-800";
};

const getDeltaIcon = (value: number | null) => {
  if (value === null || value === 0) return Activity;
  return value > 0 ? TrendingUp : TrendingDown;
};

const getDateLabel = (value?: string | null) => {
  if (!value) return "-";

  try {
    return formatFrontendDate(value);
  } catch {
    return value;
  }
};

const buildSummary = (metrics: ProgressMetric[]) => {
  const improvements = metrics.filter(
    (metric) => isImprovement(metric.delta, metric.direction) === true
  );

  if (improvements.length >= 3) {
    return "Excelente evolución: bajaste medidas clave y ganaste masa muscular.";
  }

  if (improvements.length > 0) {
    return "Buen progreso: ya hay señales positivas en tus mediciones.";
  }

  return "Hay datos cargados. Sumá una nueva medición para ver mejor la tendencia.";
};

export default function SocioEvolucionProgressInsights() {
  const router = useRouter();
  const [rows, setRows] = useState<EvolucionSocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRows = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getEvolucionesFisicas("me");

        if (!cancelled) {
          setRows(res.data);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setError("No se pudo consultar tu evolución física ahora.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRows();

    return () => {
      cancelled = true;
    };
  }, []);

  const orderedRows = useMemo(() => getOrderedRows(rows), [rows]);
  const initial = orderedRows.find((row) => row.es_registro_inicial) || orderedRows[0] || null;
  const current = orderedRows[orderedRows.length - 1] || null;

  const metrics = useMemo<ProgressMetric[]>(() => {
    if (!initial || !current) return [];

    return [
      {
        label: "Peso",
        current: formatNumber(current.peso, " kg"),
        initial: formatNumber(initial.peso, " kg"),
        delta: delta(current.peso, initial.peso),
        suffix: " kg",
        direction: "neutral",
        icon: Scale,
      },
      {
        label: "Cintura",
        current: formatNumber(current.cintura, " cm"),
        initial: formatNumber(initial.cintura, " cm"),
        delta: delta(current.cintura, initial.cintura),
        suffix: " cm",
        direction: "lower",
        icon: Ruler,
      },
      {
        label: "% grasa",
        current: formatNumber(current.porcentaje_grasa, "%"),
        initial: formatNumber(initial.porcentaje_grasa, "%"),
        delta: delta(current.porcentaje_grasa, initial.porcentaje_grasa),
        suffix: "%",
        direction: "lower",
        icon: Percent,
      },
      {
        label: "Músculo",
        current: formatNumber(current.masa_muscular, " kg"),
        initial: formatNumber(initial.masa_muscular, " kg"),
        delta: delta(current.masa_muscular, initial.masa_muscular),
        suffix: " kg",
        direction: "higher",
        icon: Dumbbell,
      },
    ];
  }, [current, initial]);

  const summary = buildSummary(metrics);

  if (loading) {
    return (
      <Card className="overflow-hidden border-violet-100 bg-white p-4 shadow-sm dark:border-violet-900/60 dark:bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-violet-100 dark:bg-violet-950" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-900">Evolución física</p>
            <p className="mt-1 text-sm leading-5 text-amber-800">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard/evolucion-fisica")}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-900"
            >
              Abrir módulo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!current || orderedRows.length < 2) {
    return (
      <Card className="overflow-hidden border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-4 shadow-sm dark:border-violet-900/60 dark:from-violet-950/30 dark:via-slate-950 dark:to-sky-950/20">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-violet-600 p-2 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
              Progreso físico
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
              {current ? "Ya tenés tu primera medición" : "Todavía no hay mediciones"}
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
              {current
                ? "Cargá una segunda evolución para comparar peso, grasa, cintura y masa muscular."
                : "Registrá tu evolución inicial para empezar a medir tu progreso real."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard/evolucion-fisica")}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white active:scale-[0.98]"
            >
              Ir a evolución física
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-violet-100 bg-gradient-to-br from-slate-950 via-violet-950 to-sky-950 p-4 text-white shadow-lg shadow-violet-950/15">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
            Progreso físico
          </p>
          <h2 className="mt-1 text-xl font-black">Tu cambio se nota</h2>
          <p className="mt-1 text-sm leading-5 text-slate-300">{summary}</p>
        </div>
        <div className="rounded-2xl bg-emerald-400/15 p-2 text-emerald-200">
          <CheckCircle2 className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const DeltaIcon = getDeltaIcon(metric.delta);

          return (
            <div
              key={metric.label}
              className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-300">{metric.label}</p>
                <Icon className="h-4 w-4 text-violet-200" />
              </div>
              <p className="mt-1 text-lg font-black">{metric.current}</p>
              <div
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${getDeltaClassName(
                  metric.delta,
                  metric.direction
                )}`}
              >
                <DeltaIcon className="h-3.5 w-3.5" />
                {formatSigned(metric.delta, metric.suffix)}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Inicial: {metric.initial}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {getDateLabel(initial.fecha)} → {getDateLabel(current.fecha)}
          </p>
          <p className="text-xs text-slate-300">{orderedRows.length} mediciones registradas</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/evolucion-fisica")}
          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-950 active:scale-[0.98]"
        >
          Ver detalle
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
