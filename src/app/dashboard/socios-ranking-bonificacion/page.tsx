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
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppFooter } from "@/components/footer/AppFooter";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";
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
import type {
  SocioRankingBonificacionItem,
  SociosRankingBonificacionResponse,
} from "@/interfaces/sociosRankingBonificacion.interface";
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
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Number(value ?? 0),
  );
}

function formatPercent(value?: number | null) {
  return `${Number(value ?? 0).toFixed(0)}%`;
}

function rbTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function monthName(anio: number, mes: number, locale: GymMasterLocale = "es") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR", {
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, 1));
}

function yesNo(locale: GymMasterLocale, value: boolean) {
  return value ? rbTx(locale, "Sí", "Yes") : rbTx(locale, "No", "No");
}

function normalizeRankingText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function translateRankingRule(locale: GymMasterLocale, value: string) {
  if (locale !== "en") return value;

  const normalized = normalizeRankingText(value);
  const rules: Record<string, string> = {
    "mayor cantidad de dias asistidos en el mes.":
      "Highest number of attended days in the month.",
    "primer desempate: cuota al dia al cierre del periodo.":
      "First tiebreaker: fee up to date at period close.",
    "segundo desempate: score operativo.":
      "Second tiebreaker: operational score.",
    "ultimo desempate: orden alfabetico.":
      "Final tiebreaker: alphabetical order.",
  };

  return rules[normalized] ?? value;
}

function translateRankingWarning(locale: GymMasterLocale, value: string) {
  if (locale !== "en") return value;

  const normalized = normalizeRankingText(value);
  if (
    normalized.includes("tabla socio_ranking_bonificacion_mensual") &&
    normalized.includes("todavia no esta disponible")
  ) {
    return "The monthly bonus ranking table is not available yet. Apply the migration to save bonuses.";
  }
  if (normalized.includes("no se pudo leer bonificaciones guardadas")) {
    return value.replace(
      /^No se pudo leer bonificaciones guardadas:/i,
      "Could not read saved bonuses:",
    );
  }
  return value;
}

function translateBonusReason(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const normalized = normalizeRankingText(raw);
  if (normalized === "bonificacion mensual por ranking")
    return "Monthly ranking bonus";
  if (normalized === "bonificacion removida") return "Bonus removed";
  if (normalized.includes("socio bonificado desde ranking")) {
    return raw.replace(
      /^Socio bonificado desde ranking/i,
      "Member bonused from ranking",
    );
  }
  return raw;
}

function translateBlockReason(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const normalized = normalizeRankingText(raw);
  if (
    normalized.includes("ya existe un pago registrado") &&
    normalized.includes("snapshot comercial")
  ) {
    return "A payment already exists for this member and month. The bonus is locked to preserve the commercial snapshot of the payment.";
  }
  if (normalized.includes("bonificacion bloqueada por pago registrado")) {
    return "Bonus locked by registered payment";
  }
  return raw;
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "red" | "blue" | "amber" | "violet";
}) {
  const classes = {
    slate: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200",
    green:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200",
    red: "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-200",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-200",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-200",
    violet:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-200",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${classes}`}
    >
      {children}
    </span>
  );
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "blue",
}: {
  title: string;
  value: string;
  helper: string;
  icon: ElementType;
  tone?: "blue" | "green" | "amber" | "violet" | "slate";
}) {
  const toneClass = {
    blue: "bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-200",
    green:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-200",
    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-200",
    slate: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200",
  }[tone];

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground dark:text-zinc-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-muted-foreground dark:text-zinc-400">
            {helper}
          </p>
        </div>
        <div className={`rounded-full p-3 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-muted-foreground dark:border-zinc-800 dark:text-zinc-400">
      {label}
    </div>
  );
}

function resolvePositionTone(
  position: number,
): "slate" | "green" | "red" | "blue" | "amber" | "violet" {
  if (position === 1) return "amber";
  if (position === 2) return "slate";
  if (position === 3) return "violet";
  return "blue";
}

export default function SociosRankingBonificacionPage() {
  const { anio: defaultAnio, mes: defaultMes } = currentYearMonth();
  const { locale } = useI18n();
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [anio, setAnio] = useState(defaultAnio);
  const [mes, setMes] = useState(defaultMes);
  const [data, setData] = useState<SociosRankingBonificacionResponse | null>(
    null,
  );
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
      toast.error(
        error?.message ||
          rbTx(
            locale,
            "No se pudo cargar el ranking mensual",
            "Could not load the monthly ranking",
          ),
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [anio, isAuthenticated, locale, mes]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) loadData();
  }, [isInitialized, isAuthenticated, loadData]);

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    soloConAsistencia,
    soloCuotaAlDia,
    soloBonificados,
    anio,
    mes,
  ]);

  const filteredRanking = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (data?.ranking ?? []).filter((item) => {
      if (term) {
        const haystack = [item.nombre_completo, item.dni, item.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (soloConAsistencia && item.asistencias <= 0) return false;
      if (soloCuotaAlDia && !item.cuota_al_dia) return false;
      if (soloBonificados && !item.bonificado) return false;
      return true;
    });
  }, [data, searchTerm, soloBonificados, soloConAsistencia, soloCuotaAlDia]);

  const topSocios = useMemo(
    () => filteredRanking.slice(0, 10),
    [filteredRanking],
  );
  const totalPages = Math.max(1, Math.ceil(filteredRanking.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRanking = filteredRanking.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleToggleBonificacion = async (
    item: SocioRankingBonificacionItem,
  ) => {
    if (!data?.schema_ready) {
      toast.error(
        rbTx(
          locale,
          "Aplicá la migración para guardar bonificaciones mensuales.",
          "Apply the migration to save monthly bonuses.",
        ),
      );
      return;
    }

    if (item.bonificacion_bloqueada) {
      toast.error(
        translateBlockReason(locale, item.bloqueo_motivo) ||
          rbTx(
            locale,
            "No se puede modificar la bonificación porque ya existe un pago registrado para ese mes.",
            "This bonus cannot be changed because a payment already exists for that month.",
          ),
      );
      return;
    }

    const nextValue = !item.bonificado;
    const descuento = nextValue
      ? Number(
          window.prompt(
            rbTx(locale, "Porcentaje de bonificación", "Bonus percentage"),
            String(item.descuento_porcentaje || 10),
          ) || 0,
        )
      : 0;
    if (
      nextValue &&
      (Number.isNaN(descuento) || descuento < 0 || descuento > 100)
    ) {
      toast.error(
        rbTx(
          locale,
          "El descuento debe estar entre 0 y 100.",
          "The discount must be between 0 and 100.",
        ),
      );
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
        motivo: nextValue
          ? "Bonificación mensual por ranking"
          : "Bonificación removida",
        observaciones: nextValue
          ? `Socio bonificado desde ranking ${monthName(anio, mes, "es")}`
          : null,
      });
      setData(response);
      toast.success(
        nextValue
          ? rbTx(
              locale,
              "Socio bonificado correctamente",
              "Member bonused successfully",
            )
          : rbTx(locale, "Bonificación removida", "Bonus removed"),
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
          rbTx(
            locale,
            "No se pudo actualizar la bonificación",
            "Could not update the bonus",
          ),
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleExportExcel = async () => {
    if (!data) return;
    const workbook = new ExcelJS.Workbook();
    const resumen = workbook.addWorksheet(rbTx(locale, "Resumen", "Summary"));
    resumen.columns = [
      { header: rbTx(locale, "Métrica", "Metric"), key: "metrica", width: 32 },
      { header: rbTx(locale, "Valor", "Value"), key: "valor", width: 18 },
    ];
    resumen.addRows([
      {
        metrica: rbTx(locale, "Período", "Period"),
        valor: monthName(anio, mes, locale),
      },
      {
        metrica: rbTx(locale, "Socios activos", "Active members"),
        valor: data.kpis.socios_activos,
      },
      {
        metrica: rbTx(
          locale,
          "Socios con asistencia",
          "Members with attendance",
        ),
        valor: data.kpis.socios_con_asistencia,
      },
      {
        metrica: rbTx(locale, "Socios cuota al día", "Members up to date"),
        valor: data.kpis.socios_cuota_al_dia,
      },
      {
        metrica: rbTx(locale, "Bonificados", "Bonused members"),
        valor: data.kpis.bonificados,
      },
      {
        metrica: rbTx(locale, "Asistencias totales", "Total attendance"),
        valor: data.kpis.asistencia_total,
      },
      {
        metrica: rbTx(locale, "Asistencia promedio", "Average attendance"),
        valor: data.kpis.asistencia_promedio,
      },
    ]);

    const rankingSheet = workbook.addWorksheet(
      rbTx(locale, "Ranking mensual", "Monthly ranking"),
    );
    rankingSheet.columns = [
      { header: "Ranking", key: "ranking", width: 10 },
      {
        header: rbTx(locale, "Socio", "Member"),
        key: "nombre_completo",
        width: 34,
      },
      { header: rbTx(locale, "DNI", "ID"), key: "dni", width: 16 },
      {
        header: rbTx(locale, "Asistencias", "Attendance"),
        key: "asistencias",
        width: 14,
      },
      {
        header: rbTx(locale, "Cuota al día", "Fee up to date"),
        key: "cuota_al_dia",
        width: 14,
      },
      { header: "Score", key: "score", width: 12 },
      {
        header: rbTx(locale, "Bonificado", "Bonused"),
        key: "bonificado",
        width: 14,
      },
      {
        header: rbTx(locale, "Descuento", "Discount"),
        key: "descuento_porcentaje",
        width: 14,
      },
      { header: rbTx(locale, "Motivo", "Reason"), key: "motivo", width: 36 },
    ];
    filteredRanking.forEach((item) => {
      rankingSheet.addRow({
        ...item,
        cuota_al_dia: yesNo(locale, item.cuota_al_dia),
        bonificado: yesNo(locale, item.bonificado),
        motivo: translateBonusReason(locale, item.motivo),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildTimestampedDownloadFileName(
      "ranking-bonificacion-socios",
      "xlsx",
    );
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!data) return;

    await downloadCommercialReportPdf({
      title: rbTx(
        locale,
        "Ranking mensual de socios",
        "Monthly member ranking",
      ),
      subtitle: monthName(anio, mes, locale),
      fileName: buildTimestampedDownloadFileName(
        "ranking-bonificacion-socios",
        "pdf",
      ),
      pageOrientation: "landscape",
      metrics: [
        {
          label: rbTx(locale, "Socios activos", "Active members"),
          value: data.kpis.socios_activos,
        },
        {
          label: rbTx(locale, "Con asistencia", "With attendance"),
          value: data.kpis.socios_con_asistencia,
        },
        {
          label: rbTx(locale, "Cuota al día", "Fee up to date"),
          value: data.kpis.socios_cuota_al_dia,
        },
        {
          label: rbTx(locale, "Bonificados", "Bonused"),
          value: data.kpis.bonificados,
        },
        {
          label: rbTx(locale, "Asistencias", "Attendance"),
          value: data.kpis.asistencia_total,
        },
      ],
      filtersLabel: rbTx(
        locale,
        `Período: ${data.periodo_desde} a ${data.periodo_hasta}. Filtro: ${searchTerm || "sin búsqueda"}`,
        `Period: ${data.periodo_desde} to ${data.periodo_hasta}. Filter: ${searchTerm || "no search"}`,
      ),
      charts: [
        {
          title: rbTx(
            locale,
            "Top socios por asistencia",
            "Top members by attendance",
          ),
          kind: "bars",
          data: topSocios.map((item) => ({
            member: item.nombre_completo.slice(0, 18),
            attendance: item.asistencias,
          })),
          labelKey: "member",
          series: [
            {
              key: "attendance",
              label: rbTx(locale, "Asistencias", "Attendance"),
              color: [2, 168, 225],
            },
          ],
        },
      ],
      rows: filteredRanking.slice(0, 40),
      columns: [
        {
          header: "#",
          width: 12,
          getValue: (row) => row.ranking,
          align: "center",
        },
        {
          header: rbTx(locale, "Socio", "Member"),
          width: 52,
          getValue: (row) => row.nombre_completo,
        },
        {
          header: rbTx(locale, "Asist.", "Att."),
          width: 18,
          getValue: (row) => row.asistencias,
          align: "center",
        },
        {
          header: rbTx(locale, "Cuota", "Fee"),
          width: 24,
          getValue: (row) =>
            row.cuota_al_dia
              ? rbTx(locale, "Al día", "Up to date")
              : rbTx(locale, "Pendiente", "Pending"),
        },
        {
          header: "Score",
          width: 18,
          getValue: (row) => row.score,
          align: "center",
        },
        {
          header: rbTx(locale, "Bonificado", "Bonused"),
          width: 28,
          getValue: (row) =>
            row.bonificado
              ? `${yesNo(locale, true)} ${row.descuento_porcentaje}%`
              : yesNo(locale, false),
        },
        {
          header: rbTx(locale, "Motivo", "Reason"),
          width: 70,
          getValue: (row) => translateBonusReason(locale, row.motivo) || "-",
        },
      ],
      footerText: rbTx(
        locale,
        "Gym Master · Ranking y bonificación mensual de socios",
        "Gym Master · Monthly member ranking and bonus",
      ),
    });
  };

  if (!isInitialized)
    return <div>{rbTx(locale, "Cargando...", "Loading...")}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader
            title={rbTx(
              locale,
              "Ranking y bonificación mensual",
              "Monthly ranking and bonus",
            )}
          />
          <main className="flex-1 space-y-6 bg-slate-50/40 p-6 text-slate-950 dark:bg-black dark:text-zinc-100">
            <section className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
                  {rbTx(
                    locale,
                    "Ranking y bonificación mensual de socios",
                    "Monthly member ranking and bonus",
                  )}
                </h1>
                <p className="text-sm text-muted-foreground dark:text-zinc-400">
                  {rbTx(
                    locale,
                    "Reconocimiento comercial para premiar constancia, cuota al día y fidelización.",
                    "Commercial recognition to reward consistency, up-to-date fees, and loyalty.",
                  )}
                </p>
              </div>
              <QaFileNameBadge file="src/app/dashboard/socios-ranking-bonificacion/page.tsx" />
            </section>

            {data?.warnings?.length ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                {data.warnings.map((warning) => (
                  <p key={warning}>
                    {translateRankingWarning(locale, warning)}
                  </p>
                ))}
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                title={rbTx(locale, "Socios activos", "Active members")}
                value={formatNumber(data?.kpis.socios_activos)}
                helper={rbTx(locale, "Base activa", "Active base")}
                icon={Users}
                tone="blue"
              />
              <MetricCard
                title={rbTx(locale, "Con asistencia", "With attendance")}
                value={formatNumber(data?.kpis.socios_con_asistencia)}
                helper={rbTx(
                  locale,
                  "Participaron este mes",
                  "Participated this month",
                )}
                icon={CheckCircle2}
                tone="green"
              />
              <MetricCard
                title={rbTx(locale, "Cuota al día", "Fee up to date")}
                value={formatNumber(data?.kpis.socios_cuota_al_dia)}
                helper={rbTx(
                  locale,
                  "Al cierre del período",
                  "At period close",
                )}
                icon={Star}
                tone="amber"
              />
              <MetricCard
                title={rbTx(locale, "Bonificados", "Bonused")}
                value={formatNumber(data?.kpis.bonificados)}
                helper={rbTx(locale, "Premios activos", "Active rewards")}
                icon={Award}
                tone="violet"
              />
              <MetricCard
                title={rbTx(
                  locale,
                  "Promedio asistencia",
                  "Average attendance",
                )}
                value={formatNumber(data?.kpis.asistencia_promedio)}
                helper={rbTx(locale, "Por socio", "Per member")}
                icon={Trophy}
                tone="slate"
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
              <Card className="border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
                <CardHeader className="border-b border-slate-200 p-4 dark:border-zinc-800">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                    {rbTx(locale, "Período y filtros", "Period and filters")}
                  </h2>
                  <p className="text-sm text-muted-foreground dark:text-zinc-400">
                    {rbTx(
                      locale,
                      "Seleccioná mes, año y criterios del ranking.",
                      "Select month, year, and ranking criteria.",
                    )}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{rbTx(locale, "Año", "Year")}</Label>
                      <Input
                        type="number"
                        min={2020}
                        max={2100}
                        value={anio}
                        onChange={(event) =>
                          setAnio(Number(event.target.value))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{rbTx(locale, "Mes", "Month")}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={mes}
                        onChange={(event) => setMes(Number(event.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {rbTx(locale, "Buscar socio", "Search member")}
                    </Label>
                    <Input
                      placeholder={rbTx(
                        locale,
                        "Nombre, DNI o email...",
                        "Name, ID, or email...",
                      )}
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>

                  <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={soloConAsistencia}
                        onCheckedChange={(value) =>
                          setSoloConAsistencia(Boolean(value))
                        }
                      />
                      {rbTx(
                        locale,
                        "Solo socios con asistencia",
                        "Only members with attendance",
                      )}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={soloCuotaAlDia}
                        onCheckedChange={(value) =>
                          setSoloCuotaAlDia(Boolean(value))
                        }
                      />
                      {rbTx(
                        locale,
                        "Solo cuota al día",
                        "Only up-to-date fees",
                      )}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={soloBonificados}
                        onCheckedChange={(value) =>
                          setSoloBonificados(Boolean(value))
                        }
                      />
                      {rbTx(locale, "Solo bonificados", "Only bonused members")}
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={loadData}
                      disabled={loading}
                      className="bg-[#02a8e1] hover:bg-[#0288b1]"
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                      {rbTx(locale, "Actualizar", "Refresh")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadPdf}
                      disabled={!data}
                    >
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportExcel}
                      disabled={!data}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
                <CardHeader className="border-b border-slate-200 p-4 dark:border-zinc-800">
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                    {rbTx(
                      locale,
                      "Top socios del mes",
                      "Top members of the month",
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground dark:text-zinc-400">
                    {monthName(anio, mes, locale)} ·{" "}
                    {rbTx(
                      locale,
                      "ranking por asistencia y cuota al día.",
                      "ranking by attendance and up-to-date fees.",
                    )}
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  {topSocios.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={topSocios.map((item) => ({
                          member: item.nombre_completo
                            .split(" ")
                            .slice(0, 2)
                            .join(" "),
                          attendance: item.asistencias,
                        }))}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-slate-200 dark:stroke-zinc-800"
                        />
                        <XAxis
                          dataKey="member"
                          tick={{ fill: "currentColor", fontSize: 12 }}
                          className="text-slate-500 dark:text-zinc-400"
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: "currentColor", fontSize: 12 }}
                          className="text-slate-500 dark:text-zinc-400"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            border: "1px solid #27272a",
                            borderRadius: 12,
                            color: "#f9fafb",
                          }}
                        />
                        <Bar
                          dataKey="attendance"
                          name={rbTx(locale, "Asistencias", "Attendance")}
                          fill="#02a8e1"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart
                      label={
                        loading
                          ? rbTx(
                              locale,
                              "Cargando ranking...",
                              "Loading ranking...",
                            )
                          : rbTx(
                              locale,
                              "Sin datos para graficar.",
                              "No data to chart.",
                            )
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </section>

            <Card className="border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
              <CardHeader className="border-b border-slate-200 p-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                      {rbTx(locale, "Ranking mensual", "Monthly ranking")}
                    </h2>
                    <p className="text-sm text-muted-foreground dark:text-zinc-400">
                      {locale === "en"
                        ? `${filteredRanking.length} filtered result${filteredRanking.length === 1 ? "" : "s"} out of ${data?.ranking.length ?? 0} members.`
                        : `${filteredRanking.length} resultado${filteredRanking.length === 1 ? "" : "s"} filtrado${filteredRanking.length === 1 ? "" : "s"} de ${data?.ranking.length ?? 0} socios.`}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-zinc-400">
                    {rbTx(locale, "Página", "Page")} {safePage}{" "}
                    {rbTx(locale, "de", "of")} {totalPages}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-zinc-900/80">
                      <TableRow>
                        <TableHead className="w-[70px]">Ranking</TableHead>
                        <TableHead>{rbTx(locale, "Socio", "Member")}</TableHead>
                        <TableHead>
                          {rbTx(locale, "Asistencias", "Attendance")}
                        </TableHead>
                        <TableHead>{rbTx(locale, "Cuota", "Fee")}</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>
                          {rbTx(locale, "Bonificación", "Bonus")}
                        </TableHead>
                        <TableHead className="text-right">
                          {rbTx(locale, "Acciones", "Actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRanking.map((item) => (
                        <TableRow
                          key={item.socio_id}
                          className="dark:border-zinc-800 dark:hover:!bg-zinc-800/80"
                        >
                          <TableCell>
                            <Badge tone={resolvePositionTone(item.ranking)}>
                              <Medal className="mr-1 inline h-3 w-3" /> #
                              {item.ranking}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-950 dark:text-white">
                              {item.nombre_completo}
                            </div>
                            <div className="text-xs text-muted-foreground dark:text-zinc-400">
                              {rbTx(locale, "DNI", "ID")} {item.dni || "-"} ·{" "}
                              {item.email ||
                                rbTx(locale, "sin email", "no email")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatNumber(item.asistencias)}
                          </TableCell>
                          <TableCell>
                            {item.cuota_al_dia ? (
                              <Badge tone="green">
                                {rbTx(locale, "Al día", "Up to date")}
                              </Badge>
                            ) : (
                              <Badge tone="red">
                                {rbTx(locale, "Pendiente", "Pending")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatNumber(item.score)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.bonificado ? (
                                <Badge tone="violet">
                                  <Percent className="mr-1 inline h-3 w-3" />{" "}
                                  {formatPercent(item.descuento_porcentaje)}
                                </Badge>
                              ) : (
                                <Badge>
                                  {rbTx(locale, "No bonificado", "No bonus")}
                                </Badge>
                              )}
                              {item.bonificacion_bloqueada ? (
                                <Badge tone="amber">
                                  {rbTx(
                                    locale,
                                    "Bloqueada por pago",
                                    "Blocked by payment",
                                  )}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={item.bonificado ? "outline" : "default"}
                              disabled={
                                savingId === item.socio_id ||
                                item.bonificacion_bloqueada
                              }
                              title={
                                item.bonificacion_bloqueada
                                  ? translateBlockReason(
                                      locale,
                                      item.bloqueo_motivo,
                                    ) ||
                                    rbTx(
                                      locale,
                                      "Bonificación bloqueada por pago registrado",
                                      "Bonus locked by registered payment",
                                    )
                                  : undefined
                              }
                              onClick={() => handleToggleBonificacion(item)}
                              className={
                                item.bonificado
                                  ? ""
                                  : "bg-[#02a8e1] hover:bg-[#0288b1]"
                              }
                            >
                              {item.bonificado ? (
                                <XCircle className="mr-2 h-4 w-4" />
                              ) : (
                                <Award className="mr-2 h-4 w-4" />
                              )}
                              {item.bonificacion_bloqueada
                                ? rbTx(locale, "Bloqueada", "Blocked")
                                : item.bonificado
                                  ? rbTx(locale, "Quitar", "Remove")
                                  : rbTx(locale, "Bonificar", "Bonus")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!paginatedRanking.length && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-10 text-center text-sm text-muted-foreground"
                          >
                            {loading
                              ? rbTx(
                                  locale,
                                  "Cargando ranking...",
                                  "Loading ranking...",
                                )
                              : rbTx(
                                  locale,
                                  "No hay socios para los filtros seleccionados.",
                                  "No members match the selected filters.",
                                )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    disabled={safePage <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    {rbTx(locale, "Anterior", "Previous")}
                  </Button>
                  <div className="text-sm text-muted-foreground dark:text-zinc-400">
                    {rbTx(locale, "Mostrando", "Showing")}{" "}
                    {paginatedRanking.length} {rbTx(locale, "de", "of")}{" "}
                    {filteredRanking.length}
                  </div>
                  <Button
                    variant="outline"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    {rbTx(locale, "Siguiente", "Next")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
              <CardHeader className="border-b border-slate-200 p-4 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  {rbTx(locale, "Reglas comerciales", "Commercial rules")}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-zinc-400">
                  {rbTx(
                    locale,
                    "Criterios usados para calcular el ranking mensual.",
                    "Criteria used to calculate the monthly ranking.",
                  )}
                </p>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                {(data?.reglas ?? []).map((regla, index) => (
                  <div
                    key={regla}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <CalendarDays className="mb-2 h-4 w-4 text-[#02a8e1]" />
                    <span className="font-semibold">
                      {rbTx(locale, "Regla", "Rule")} {index + 1}:{" "}
                    </span>
                    {translateRankingRule(locale, regla)}
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
