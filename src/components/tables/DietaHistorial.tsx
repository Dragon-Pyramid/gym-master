"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Activity, CalendarDays, CheckCircle2, ChevronRight, Clock, Target, Utensils } from "lucide-react";
import { getDietasPorSocio } from "@/services/apiClient";
import type { Dieta } from "@/interfaces/dieta.interface";
import { formatFrontendDate } from "@/utils/dateFormat";
import DietaDisplay from "@/components/dashboard/dietas/DietaDisplay";
import { useI18n } from "@/i18n/I18nProvider";
import { translateDietGoal, translateDietPlanName } from "@/utils/dietaI18nPresentation";

function calculateDays(start?: string, end?: string) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function getDateOnly(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

type DietStatusKey = "upcoming" | "finished" | "active" | "manual";

function getDietStatusKey(dieta: Dieta): DietStatusKey {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = getDateOnly(dieta.fecha_inicio);
  const end = getDateOnly(dieta.fecha_fin);

  if (start && today < start) return "upcoming";
  if (end && today > end) return "finished";
  if (start || end) return "active";
  return "manual";
}

function getDietStatusLabel(dieta: Dieta, isEnglish: boolean) {
  const key = getDietStatusKey(dieta);
  const labels: Record<DietStatusKey, { es: string; en: string }> = {
    upcoming: { es: "Próxima", en: "Upcoming" },
    finished: { es: "Finalizada", en: "Finished" },
    active: { es: "Vigente", en: "Active" },
    manual: { es: "Manual", en: "Manual" },
  };
  return isEnglish ? labels[key].en : labels[key].es;
}

function countMeals(observaciones?: string) {
  if (!observaciones?.trim()) return 0;

  try {
    const parsed = JSON.parse(observaciones);
    if (Array.isArray(parsed)) return parsed.length;
    if (typeof parsed === "object" && parsed !== null) return Object.keys(parsed).length;
  } catch {
    return observaciones.trim() ? 1 : 0;
  }

  return 0;
}

function dietMatchesSearch(dieta: Dieta, searchTerm: string) {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) return true;

  return [dieta.nombre_plan, dieta.objetivo, dieta.observaciones]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

export default function DietaHistorial({
  socioId,
  refreshKey = 0,
  searchTerm = "",
}: {
  socioId: number | string;
  refreshKey?: number;
  searchTerm?: string;
}) {
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const [dietas, setDietas] = useState<Dieta[]>([]);
  const [selected, setSelected] = useState<Dieta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDietas = async () => {
      if (!socioId) {
        setDietas([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await getDietasPorSocio(socioId.toString());
        if (res.ok && Array.isArray(res.data)) {
          setDietas(res.data);
        } else {
          setDietas([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDietas();
  }, [socioId, refreshKey]);

  const dietasOrdenadas = useMemo(
    () =>
      [...dietas]
        .filter((dieta) => dietMatchesSearch(dieta, searchTerm))
        .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)),
    [dietas, searchTerm]
  );

  const dietaVigente = useMemo(
    () => dietasOrdenadas.find((dieta) => getDietStatusKey(dieta) === "active") ?? dietasOrdenadas[0],
    [dietasOrdenadas]
  );
  const totalComidas = useMemo(
    () => dietasOrdenadas.reduce((total, dieta) => total + countMeals(dieta.observaciones), 0),
    [dietasOrdenadas]
  );

  if (selected) {
    return (
      <DietaDisplay
        dieta={selected}
        onBack={() => setSelected(null)}
        backLabel={tx("Volver a mis dietas", "Back to my diets")}
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    );
  }

  if (dietasOrdenadas.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed bg-muted/30 p-6 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <Utensils className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-bold">
          {tx("Todavía no hay dietas para mostrar", "There are no diets to show yet")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {tx(
            "Cuando el gimnasio cargue una dieta, vas a poder verla acá con el detalle de comidas y descargar el PDF.",
            "When the gym loads a diet, you will be able to view it here with meal details and download the PDF."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
            <Activity className="h-4 w-4" /> {tx("Estado actual", "Current status")}
          </div>
          <p className="mt-2 text-xl font-black text-emerald-950 dark:text-emerald-100">
            {dietaVigente ? getDietStatusLabel(dietaVigente, isEnglish) : tx("Sin datos", "No data")}
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-emerald-900/75 dark:text-emerald-100/70">
            {translateDietPlanName(dietaVigente?.nombre_plan, isEnglish) || tx("Esperando una dieta asignada", "Waiting for an assigned diet")}
          </p>
        </div>
        <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-950/20">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-200">
            <Utensils className="h-4 w-4" /> {tx("Planes", "Plans")}
          </div>
          <p className="mt-2 text-xl font-black text-sky-950 dark:text-sky-100">
            {dietasOrdenadas.length}
          </p>
          <p className="mt-1 text-xs text-sky-900/75 dark:text-sky-100/70">
            {tx("dietas disponibles para consulta", "diets available for review")}
          </p>
        </div>
        <div className="rounded-3xl border border-lime-100 bg-lime-50 p-4 dark:border-lime-900/50 dark:bg-lime-950/20">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-lime-700 dark:text-lime-200">
            <CheckCircle2 className="h-4 w-4" /> {tx("Comidas", "Meals")}
          </div>
          <p className="mt-2 text-xl font-black text-lime-950 dark:text-lime-100">
            {totalComidas || "—"}
          </p>
          <p className="mt-1 text-xs text-lime-900/75 dark:text-lime-100/70">
            {tx("bloques alimentarios cargados", "loaded meal blocks")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {dietasOrdenadas.map((dieta) => {
          const meals = countMeals(dieta.observaciones);
          const duration = calculateDays(dieta.fecha_inicio, dieta.fecha_fin);

          return (
            <Card key={dieta.id} className="overflow-hidden rounded-3xl border-sky-100 shadow-sm dark:border-sky-900/50 dark:bg-slate-950">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-200">
                      {tx("Dieta asignada", "Assigned diet")}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-extrabold leading-tight text-slate-900 dark:text-slate-50">
                      {translateDietPlanName(dieta.nombre_plan, isEnglish)}
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-100 dark:ring-emerald-800">
                    {meals || "-"} {tx("comidas", "meals")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {getDietStatusLabel(dieta, isEnglish)}
                  </span>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-100">
                    {tx("Seguimiento mobile", "Mobile tracking")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-2xl bg-muted/40 p-3 dark:bg-slate-900/70">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <Target className="h-3.5 w-3.5" /> {tx("Objetivo", "Goal")}
                    </div>
                    <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">
                      {translateDietGoal(dieta.objetivo, isEnglish)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3 dark:bg-slate-900/70">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {tx("Duración", "Duration")}
                    </div>
                    <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">
                      {duration > 0 ? `${duration} ${tx("días", "days")}` : tx("Manual", "Manual")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3 dark:bg-slate-900/70">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> {tx("Inicio", "Start")}
                    </div>
                    <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">{formatFrontendDate(dieta.fecha_inicio)}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3 dark:bg-slate-900/70">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> {tx("Fin", "End")}
                    </div>
                    <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">{formatFrontendDate(dieta.fecha_fin)}</p>
                  </div>
                </div>

                <Button className="w-full justify-between rounded-2xl" onClick={() => setSelected(dieta)}>
                  {tx("Ver plan alimentario", "View meal plan")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="hidden md:block">
        <Table className="w-full overflow-hidden text-sm border rounded-md border-border dark:border-slate-800">
          <TableHeader>
            <TableRow className="bg-muted/50 text-muted-foreground dark:bg-slate-900/80">
              <TableHead>{tx("Nombre plan", "Plan name")}</TableHead>
              <TableHead>{tx("Objetivo", "Goal")}</TableHead>
              <TableHead>{tx("Comidas", "Meals")}</TableHead>
              <TableHead>{tx("Fecha inicio", "Start date")}</TableHead>
              <TableHead>{tx("Fecha fin", "End date")}</TableHead>
              <TableHead className="text-right">{tx("Acciones", "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dietasOrdenadas.map((d) => (
              <TableRow
                key={d.id}
                className="odd:bg-muted/40 transition-colors hover:bg-[#a8d9f9] dark:odd:bg-slate-900/50 dark:hover:bg-sky-950/40"
              >
                <TableCell className="font-medium">{translateDietPlanName(d.nombre_plan, isEnglish)}</TableCell>
                <TableCell>{translateDietGoal(d.objetivo, isEnglish)}</TableCell>
                <TableCell>{countMeals(d.observaciones) || "-"}</TableCell>
                <TableCell>{formatFrontendDate(d.fecha_inicio)}</TableCell>
                <TableCell>{formatFrontendDate(d.fecha_fin)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelected(d)}>
                    {tx("Ver plan", "View plan")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50 text-muted-foreground dark:bg-slate-900/80">
              <TableCell colSpan={5}>{tx("Total de dietas", "Total diets")}</TableCell>
              <TableCell className="text-right font-bold">{dietasOrdenadas.length}</TableCell>
            </TableRow>
          </TableFooter>
          <TableCaption>{tx("Historial de dietas registradas.", "Registered diet history.")}</TableCaption>
        </Table>
      </div>
    </div>
  );
}
