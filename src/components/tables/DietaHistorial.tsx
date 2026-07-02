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
import { CalendarDays, ChevronRight, Clock, Target, Utensils } from "lucide-react";
import { getDietasPorSocio } from "@/services/apiClient";
import type { Dieta } from "@/interfaces/dieta.interface";
import { formatFrontendDate } from "@/utils/dateFormat";
import DietaDisplay from "@/components/dashboard/dietas/DietaDisplay";

function calculateDays(start?: string, end?: string) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
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

  if (selected) {
    return (
      <DietaDisplay
        dieta={selected}
        onBack={() => setSelected(null)}
        backLabel="Volver a mis dietas"
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
      <div className="rounded-3xl border border-dashed bg-muted/30 p-6 text-center">
        <Utensils className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-bold">Todavía no hay dietas para mostrar</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando el gimnasio cargue una dieta, vas a poder verla acá con el detalle de comidas y descargar el PDF.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid gap-3 md:hidden">
        {dietasOrdenadas.map((dieta) => {
          const meals = countMeals(dieta.observaciones);
          const duration = calculateDays(dieta.fecha_inicio, dieta.fecha_fin);

          return (
            <Card key={dieta.id} className="overflow-hidden rounded-3xl border-sky-100 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700">
                      Dieta asignada
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-extrabold leading-tight text-slate-900">
                      {dieta.nombre_plan || "Plan alimentario"}
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    {meals || "-"} comidas
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <Target className="h-3.5 w-3.5" /> Objetivo
                    </div>
                    <p className="mt-1 font-bold text-slate-900">{dieta.objetivo || "No definido"}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> Duración
                    </div>
                    <p className="mt-1 font-bold text-slate-900">
                      {duration > 0 ? `${duration} días` : "Manual"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> Inicio
                    </div>
                    <p className="mt-1 font-bold text-slate-900">{formatFrontendDate(dieta.fecha_inicio)}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> Fin
                    </div>
                    <p className="mt-1 font-bold text-slate-900">{formatFrontendDate(dieta.fecha_fin)}</p>
                  </div>
                </div>

                <Button className="w-full justify-between rounded-2xl" onClick={() => setSelected(dieta)}>
                  Ver plan alimentario
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="hidden md:block">
        <Table className="w-full overflow-hidden text-sm border rounded-md border-border">
          <TableHeader>
            <TableRow className="bg-muted/50 text-muted-foreground">
              <TableHead>Nombre plan</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Comidas</TableHead>
              <TableHead>Fecha inicio</TableHead>
              <TableHead>Fecha fin</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dietasOrdenadas.map((d) => (
              <TableRow
                key={d.id}
                className="odd:bg-muted/40 hover:bg-[#a8d9f9] transition-colors"
              >
                <TableCell className="font-medium">{d.nombre_plan}</TableCell>
                <TableCell>{d.objetivo || "No definido"}</TableCell>
                <TableCell>{countMeals(d.observaciones) || "-"}</TableCell>
                <TableCell>{formatFrontendDate(d.fecha_inicio)}</TableCell>
                <TableCell>{formatFrontendDate(d.fecha_fin)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelected(d)}>
                    Ver plan
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50 text-muted-foreground">
              <TableCell colSpan={5}>Total de dietas</TableCell>
              <TableCell className="text-right font-bold">{dietasOrdenadas.length}</TableCell>
            </TableRow>
          </TableFooter>
          <TableCaption>Historial de dietas registradas.</TableCaption>
        </Table>
      </div>
    </div>
  );
}
