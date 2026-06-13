"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Medal,
  Percent,
  RefreshCw,
  Star,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SocioRankingBonificacionItem, SociosRankingBonificacionResponse } from "@/interfaces/sociosRankingBonificacion.interface";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { useAuthStore } from "@/stores/authStore";
import {
  fetchSociosRankingBonificacion,
  updateSocioRankingBonificacion,
} from "@/services/sociosRankingBonificacionService";

const PAGE_SIZE = 12;

function currentYearMonth() {
  const now = new Date();
  return { anio: now.getFullYear(), mes: now.getMonth() + 1 };
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function formatPercent(value?: number | null) {
  return `${Number(value ?? 0).toFixed(0)}%`;
}

function monthName(anio: number, mes: number) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(anio, mes - 1, 1));
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "red" | "blue" | "amber" | "violet" }) {
  const classes = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  }[tone];

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>{children}</span>;
}

function MetricCard({ title, value, helper, icon: Icon, tone = "blue" }: { title: string; value: string; helper: string; icon: ElementType; tone?: "blue" | "green" | "amber" | "violet" | "slate" }) {
  const toneClass = {
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-slate-950">{value}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className={`rounded-full p-3 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">{label}</div>;
}

function resolvePositionTone(position: number): "slate" | "green" | "red" | "blue" | "amber" | "violet" {
  if (position === 1) return "amber";
  if (position === 2) return "slate";
  if (position === 3) return "violet";
  return "blue";
}

export default function SociosRankingBonificacionPage() {
  const { anio: defaultAnio, mes: defaultMes } = currentYearMonth();
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [anio, setAnio] = useState(defaultAnio);
  const [mes, setMes] = useState(defaultMes);
  const [data, setData] = useState<SociosRankingBonificacionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [soloConAsistencia, setSoloConAsistencia] = useState(false);
  const [soloCuotaAlDia, setSoloCuotaAlDia] = useState(false);
  const [soloBonificados, setSoloBonificados] = useState(false);
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, isInitialized, router]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await fetchSociosRankingBonificacion(anio, mes);
      setData(response);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo cargar el ranking mensual");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [anio, isAuthenticated, mes]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) loadData();
  }, [isInitialized, isAuthenticated, loadData]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, soloConAsistencia, soloCuotaAlDia, soloBonificados, anio, mes]);

  const filteredRanking = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (data?.ranking ?? []).filter((item) => {
      if (term) {
        const haystack = [item.nombre_completo, item.dni, item.email].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (soloConAsistencia && item.asistencias <= 0) return false;
      if (soloCuotaAlDia && !item.cuota_al_dia) return false;
      if (soloBonificados && !item.bonificado) return false;
      return true;
    });
  }, [data, searchTerm, soloBonificados, soloConAsistencia, soloCuotaAlDia]);

  const topSocios = useMemo(() => filteredRanking.slice(0, 10), [filteredRanking]);
  const totalPages = Math.max(1, Math.ceil(filteredRanking.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRanking = filteredRanking.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleToggleBonificacion = async (item: SocioRankingBonificacionItem) => {
    if (!data?.schema_ready) {
      toast.error("Aplicá la migración para guardar bonificaciones mensuales.");
      return;
    }

    if (item.bonificacion_bloqueada) {
      toast.error(
        item.bloqueo_motivo ||
          "No se puede modificar la bonificación porque ya existe un pago registrado para ese mes.",
      );
      return;
    }

    const nextValue = !item.bonificado;
    const descuento = nextValue ? Number(window.prompt("Porcentaje de bonificación", String(item.descuento_porcentaje || 10)) || 0) : 0;
    if (nextValue && (Number.isNaN(descuento) || descuento < 0 || descuento > 100)) {
      toast.error("El descuento debe estar entre 0 y 100.");
      return;
    }

    setSavingId(item.socio_id);
    try {
      const response = await updateSocioRankingBonificacion({
        socio_id: item.socio_id,
        anio,
        mes,
        bonificado: nextValue,
        descuento_porcentaje: descuento,
        motivo: nextValue ? "Bonificación mensual por ranking" : "Bonificación removida",
        observaciones: nextValue ? `Socio bonificado desde ranking ${monthName(anio, mes)}` : null,
      });
      setData(response);
      toast.success(nextValue ? "Socio bonificado correctamente" : "Bonificación removida");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar la bonificación");
    } finally {
      setSavingId(null);
    }
  };

  const handleExportExcel = async () => {
    if (!data) return;
    const workbook = new ExcelJS.Workbook();
    const resumen = workbook.addWorksheet("Resumen");
    resumen.columns = [
      { header: "Métrica", key: "metrica", width: 32 },
      { header: "Valor", key: "valor", width: 18 },
    ];
    resumen.addRows([
      { metrica: "Período", valor: monthName(anio, mes) },
      { metrica: "Socios activos", valor: data.kpis.socios_activos },
      { metrica: "Socios con asistencia", valor: data.kpis.socios_con_asistencia },
      { metrica: "Socios cuota al día", valor: data.kpis.socios_cuota_al_dia },
      { metrica: "Bonificados", valor: data.kpis.bonificados },
      { metrica: "Asistencias totales", valor: data.kpis.asistencia_total },
      { metrica: "Asistencia promedio", valor: data.kpis.asistencia_promedio },
    ]);

    const rankingSheet = workbook.addWorksheet("Ranking mensual");
    rankingSheet.columns = [
      { header: "Ranking", key: "ranking", width: 10 },
      { header: "Socio", key: "nombre_completo", width: 34 },
      { header: "DNI", key: "dni", width: 16 },
      { header: "Asistencias", key: "asistencias", width: 14 },
      { header: "Cuota al día", key: "cuota_al_dia", width: 14 },
      { header: "Score", key: "score", width: 12 },
      { header: "Bonificado", key: "bonificado", width: 14 },
      { header: "Descuento", key: "descuento_porcentaje", width: 14 },
      { header: "Motivo", key: "motivo", width: 36 },
    ];
    filteredRanking.forEach((item) => {
      rankingSheet.addRow({
        ...item,
        cuota_al_dia: item.cuota_al_dia ? "Sí" : "No",
        bonificado: item.bonificado ? "Sí" : "No",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildTimestampedDownloadFileName("ranking-bonificacion-socios", "xlsx");
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!data) return;

    await downloadCommercialReportPdf({
      title: "Ranking mensual de socios",
      subtitle: monthName(anio, mes),
      fileName: buildTimestampedDownloadFileName("ranking-bonificacion-socios", "pdf"),
      pageOrientation: "landscape",
      metrics: [
        { label: "Socios activos", value: data.kpis.socios_activos },
        { label: "Con asistencia", value: data.kpis.socios_con_asistencia },
        { label: "Cuota al día", value: data.kpis.socios_cuota_al_dia },
        { label: "Bonificados", value: data.kpis.bonificados },
        { label: "Asistencias", value: data.kpis.asistencia_total },
      ],
      filtersLabel: `Período: ${data.periodo_desde} a ${data.periodo_hasta}. Filtro: ${searchTerm || "sin búsqueda"}`,
      charts: [
        {
          title: "Top socios por asistencia",
          kind: "bars",
          data: topSocios.map((item) => ({ socio: item.nombre_completo.slice(0, 18), asistencias: item.asistencias })),
          labelKey: "socio",
          series: [{ key: "asistencias", label: "Asistencias", color: [2, 168, 225] }],
        },
      ],
      rows: filteredRanking.slice(0, 40),
      columns: [
        { header: "#", width: 12, getValue: (row) => row.ranking, align: "center" },
        { header: "Socio", width: 52, getValue: (row) => row.nombre_completo },
        { header: "Asist.", width: 18, getValue: (row) => row.asistencias, align: "center" },
        { header: "Cuota", width: 24, getValue: (row) => (row.cuota_al_dia ? "Al día" : "Pendiente") },
        { header: "Score", width: 18, getValue: (row) => row.score, align: "center" },
        { header: "Bonificado", width: 28, getValue: (row) => (row.bonificado ? `Sí ${row.descuento_porcentaje}%` : "No") },
        { header: "Motivo", width: 70, getValue: (row) => row.motivo || "-" },
      ],
      footerText: "Gym Master · Ranking y bonificación mensual de socios",
    });
  };

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Ranking y bonificación mensual" />
          <main className="flex-1 space-y-6 p-6">
            <section className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-950">Ranking y bonificación mensual de socios</h1>
                <p className="text-sm text-muted-foreground">
                  Reconocimiento comercial para premiar constancia, cuota al día y fidelización.
                </p>
              </div>
              <QaFileNameBadge file="src/app/dashboard/socios-ranking-bonificacion/page.tsx" />
            </section>

            {data?.warnings?.length ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {data.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard title="Socios activos" value={formatNumber(data?.kpis.socios_activos)} helper="Base activa" icon={Users} tone="blue" />
              <MetricCard title="Con asistencia" value={formatNumber(data?.kpis.socios_con_asistencia)} helper="Participaron este mes" icon={CheckCircle2} tone="green" />
              <MetricCard title="Cuota al día" value={formatNumber(data?.kpis.socios_cuota_al_dia)} helper="Al cierre del período" icon={Star} tone="amber" />
              <MetricCard title="Bonificados" value={formatNumber(data?.kpis.bonificados)} helper="Premios activos" icon={Award} tone="violet" />
              <MetricCard title="Promedio asistencia" value={formatNumber(data?.kpis.asistencia_promedio)} helper="Por socio" icon={Trophy} tone="slate" />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
              <Card>
                <CardHeader className="border-b p-4">
                  <h2 className="text-xl font-bold">Período y filtros</h2>
                  <p className="text-sm text-muted-foreground">Seleccioná mes, año y criterios del ranking.</p>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Año</Label>
                      <Input type="number" min={2020} max={2100} value={anio} onChange={(event) => setAnio(Number(event.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mes</Label>
                      <Input type="number" min={1} max={12} value={mes} onChange={(event) => setMes(Number(event.target.value))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Buscar socio</Label>
                    <Input placeholder="Nombre, DNI o email..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                  </div>

                  <div className="space-y-3 rounded-xl border p-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={soloConAsistencia} onCheckedChange={(value) => setSoloConAsistencia(Boolean(value))} />
                      Solo socios con asistencia
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={soloCuotaAlDia} onCheckedChange={(value) => setSoloCuotaAlDia(Boolean(value))} />
                      Solo cuota al día
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={soloBonificados} onCheckedChange={(value) => setSoloBonificados(Boolean(value))} />
                      Solo bonificados
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={loadData} disabled={loading} className="bg-[#02a8e1] hover:bg-[#0288b1]">
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      Actualizar
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={!data}>
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel} disabled={!data}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b p-4">
                  <h2 className="text-xl font-bold">Top socios del mes</h2>
                  <p className="text-sm text-muted-foreground">{monthName(anio, mes)} · ranking por asistencia y cuota al día.</p>
                </CardHeader>
                <CardContent className="p-4">
                  {topSocios.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topSocios.map((item) => ({ socio: item.nombre_completo.split(" ").slice(0, 2).join(" "), asistencias: item.asistencias }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="socio" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="asistencias" name="Asistencias" fill="#02a8e1" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart label={loading ? "Cargando ranking..." : "Sin datos para graficar."} />
                  )}
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader className="border-b p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Ranking mensual</h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredRanking.length} resultado{filteredRanking.length === 1 ? "" : "s"} filtrado{filteredRanking.length === 1 ? "" : "s"} de {data?.ranking.length ?? 0} socios.
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">Página {safePage} de {totalPages}</div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[70px]">Ranking</TableHead>
                        <TableHead>Socio</TableHead>
                        <TableHead>Asistencias</TableHead>
                        <TableHead>Cuota</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Bonificación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRanking.map((item) => (
                        <TableRow key={item.socio_id}>
                          <TableCell>
                            <Badge tone={resolvePositionTone(item.ranking)}>
                              <Medal className="mr-1 inline h-3 w-3" /> #{item.ranking}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-950">{item.nombre_completo}</div>
                            <div className="text-xs text-muted-foreground">DNI {item.dni || "-"} · {item.email || "sin email"}</div>
                          </TableCell>
                          <TableCell>{formatNumber(item.asistencias)}</TableCell>
                          <TableCell>{item.cuota_al_dia ? <Badge tone="green">Al día</Badge> : <Badge tone="red">Pendiente</Badge>}</TableCell>
                          <TableCell>{formatNumber(item.score)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.bonificado ? (
                                <Badge tone="violet"><Percent className="mr-1 inline h-3 w-3" /> {formatPercent(item.descuento_porcentaje)}</Badge>
                              ) : (
                                <Badge>No bonificado</Badge>
                              )}
                              {item.bonificacion_bloqueada ? <Badge tone="amber">Bloqueada por pago</Badge> : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={item.bonificado ? "outline" : "default"}
                              disabled={savingId === item.socio_id || item.bonificacion_bloqueada}
                              title={item.bonificacion_bloqueada ? item.bloqueo_motivo || "Bonificación bloqueada por pago registrado" : undefined}
                              onClick={() => handleToggleBonificacion(item)}
                              className={item.bonificado ? "" : "bg-[#02a8e1] hover:bg-[#0288b1]"}
                            >
                              {item.bonificado ? <XCircle className="mr-2 h-4 w-4" /> : <Award className="mr-2 h-4 w-4" />}
                              {item.bonificacion_bloqueada ? "Bloqueada" : item.bonificado ? "Quitar" : "Bonificar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!paginatedRanking.length && (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                            {loading ? "Cargando ranking..." : "No hay socios para los filtros seleccionados."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <Button variant="outline" disabled={safePage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Anterior</Button>
                  <div className="text-sm text-muted-foreground">Mostrando {paginatedRanking.length} de {filteredRanking.length}</div>
                  <Button variant="outline" disabled={safePage >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>Siguiente</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b p-4">
                <h2 className="text-xl font-bold">Reglas comerciales</h2>
                <p className="text-sm text-muted-foreground">Criterios usados para calcular el ranking mensual.</p>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                {(data?.reglas ?? []).map((regla, index) => (
                  <div key={regla} className="rounded-xl border bg-white p-4 text-sm">
                    <CalendarDays className="mb-2 h-4 w-4 text-[#02a8e1]" />
                    <span className="font-semibold">Regla {index + 1}: </span>{regla}
                  </div>
                ))}
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
