"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Megaphone,
  Percent,
  RefreshCcw,
  TrendingUp,
  Users,
  VenusAndMars,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SociosDemografiaBiResponse } from "@/interfaces/sociosDemografiaBi.interface";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { getSociosDemografiaPromocionesBi } from "@/services/sociosDemografiaBiService";
import { useAuthStore } from "@/stores/authStore";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { formatFrontendDate } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";

const CHART_COLORS = [
  "#0284c7",
  "#ec4899",
  "#64748b",
  "#16a34a",
  "#f97316",
  "#7c3aed",
  "#dc2626",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfCurrentYearISO() {
  return `${new Date().getFullYear()}-01-01`;
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "-";
  return `${Number(value).toFixed(1)}%`;
}

function biTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeBiText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function formatAge(locale: GymMasterLocale, value?: number | null) {
  if (value === null || value === undefined) return "-";
  return locale === "en"
    ? `${Number(value).toFixed(1)} years`
    : `${Number(value).toFixed(1)} años`;
}

const AGE_BAND_TRANSLATIONS: Record<string, string> = {
  "menores de 18": "Under 18",
  "18 a 24": "18 to 24",
  "25 a 34": "25 to 34",
  "35 a 44": "35 to 44",
  "45 a 54": "45 to 54",
  "55 o mas": "55 or older",
  "sin fecha de nacimiento": "No birth date",
};

const GENDER_TRANSLATIONS: Record<string, string> = {
  hombres: "Men",
  hombre: "Men",
  mujeres: "Women",
  mujer: "Women",
  "sin dato": "No data",
  "no data": "No data",
};

function translateAgeBand(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;
  return AGE_BAND_TRANSLATIONS[normalizeBiText(raw)] ?? raw;
}

function translateGenderLabel(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;
  return GENDER_TRANSLATIONS[normalizeBiText(raw)] ?? raw;
}

function translateSegmentLabel(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  return raw
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => translateGenderLabel(locale, translateAgeBand(locale, part)))
    .join(" · ");
}

function translatePriority(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const normalized = normalizeBiText(raw);
  if (normalized === "alta") return "High";
  if (normalized === "media") return "Medium";
  if (normalized === "baja") return "Low";
  return raw;
}

function translateRankingType(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const normalized = normalizeBiText(raw);
  if (normalized === "producto") return "Product";
  if (normalized === "servicio") return "Service";
  if (normalized === "venta_sin_detalle") return "Sale without detail";
  return raw;
}

function biSalesCount(locale: GymMasterLocale, count: number) {
  return locale === "en"
    ? `${formatNumber(count)} registered ${count === 1 ? "sale" : "sales"}`
    : `${formatNumber(count)} ventas registradas`;
}

function translatePromotionTitle(
  locale: GymMasterLocale,
  value?: string | null,
) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const translations: Record<string, string> = {
    "campana de fidelizacion para el segmento mas activo":
      "Loyalty campaign for the most active segment",
    "reactivacion de socios con baja asistencia":
      "Member reactivation with low attendance",
    "promocion cruzada para segmento con mayor consumo":
      "Cross-sell promotion for the highest-consumption segment",
    "oferta principal para la franja demografica dominante":
      "Main offer for the dominant demographic group",
    "impulsar producto o servicio de mayor traccion":
      "Promote the highest-traction product or service",
  };

  return translations[normalizeBiText(raw)] ?? raw;
}

function translatePromotionAction(
  locale: GymMasterLocale,
  value?: string | null,
) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const translations: Record<string, string> = {
    "ofrecer beneficio por continuidad, desafio mensual o programa de referidos para capitalizar el habito de asistencia.":
      "Offer a continuity benefit, monthly challenge, or referral program to capitalize on the attendance habit.",
    "enviar campana de motivacion, rutina breve de reinicio o promocion de acompanamiento por entrenador.":
      "Send a motivation campaign, short restart routine, or trainer-supported promotion.",
    "crear combo de producto/servicio asociado al comportamiento de compra del segmento.":
      "Create a product/service bundle associated with the segment purchase behavior.",
    "ajustar comunicacion, horarios y beneficios comerciales a la franja con mayor presencia.":
      "Adjust communication, schedules, and commercial benefits for the age range with the strongest presence.",
    "usar este item como gancho comercial, pack mensual o beneficio de renovacion.":
      "Use this item as a commercial hook, monthly pack, or renewal benefit.",
  };

  return translations[normalizeBiText(raw)] ?? raw;
}

function translatePromotionDescription(
  locale: GymMasterLocale,
  item: {
    titulo?: string | null;
    descripcion?: string | null;
    segmento?: string | null;
  },
) {
  const raw = String(item.descripcion ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const title = normalizeBiText(item.titulo);
  const segment = translateSegmentLabel(locale, item.segmento);
  if (title.includes("fidelizacion")) {
    const attendances =
      raw.match(/concentra\s+(\d[\d.,]*)\s+asistencias/i)?.[1] ?? "";
    return `${segment} concentrates ${attendances} attendances in the period.`;
  }

  if (title.includes("reactivacion")) {
    return `${segment} shows low relative attendance during the analyzed period.`;
  }

  if (title.includes("promocion cruzada")) {
    const amount = raw.match(/consumo por\s+([\d.,]+)\s+ARS/i)?.[1] ?? "";
    return `${segment} generated consumption of ARS ${amount}.`;
  }

  if (title.includes("franja demografica")) {
    const members = raw.match(/reúne\s+(\d[\d.,]*)\s+socios/i)?.[1] ?? "";
    return `${segment} brings together ${members} active members.`;
  }

  if (title.includes("mayor traccion")) {
    const itemName = raw.split(" lidera ")[0] || raw;
    return `${itemName} leads the consumption ranking for ${segment}.`;
  }

  return raw
    .replace(/asistencias en el período/gi, "attendances in the period")
    .replace(/socios activos/gi, "active members")
    .replace(
      /muestra baja asistencia relativa durante el período analizado/gi,
      "shows low relative attendance during the analyzed period",
    );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "default" | "blue" | "green" | "pink" | "warning";
}) {
  const toneClass = {
    default:
      "bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-200",
    blue: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    green:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    pink: "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  }[tone];

  return (
    <Card className="bg-white text-slate-950 dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
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
    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export default function BiSociosDemografiaPromocionesPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const { locale } = useI18n();
  const c = (es: string, en: string) => biTx(locale, es, en);
  const router = useRouter();
  const [desde, setDesde] = useState(firstDayOfCurrentYearISO());
  const [hasta, setHasta] = useState(todayISO());
  const [data, setData] = useState<SociosDemografiaBiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadData = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await getSociosDemografiaPromocionesBi({ desde, hasta });
      setData(response);
    } catch (error: any) {
      toast.error(
        error.message ||
          c(
            "No se pudo cargar el BI demográfico de socios",
            "Unable to load members demographic BI",
          ),
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitialized]);

  const metricas = data?.metricas;
  const generoData = useMemo(
    () =>
      (data?.distribucion_genero ?? [])
        .filter((item) => item.cantidad > 0)
        .map((item) => ({
          ...item,
          label: translateGenderLabel(locale, item.label),
        })),
    [data, locale],
  );
  const franjasData = useMemo(
    () =>
      (data?.franjas_etarias ?? []).map((item) => ({
        ...item,
        franja: translateAgeBand(locale, item.franja),
      })),
    [data, locale],
  );
  const altasData = useMemo(() => data?.altas_mensuales ?? [], [data]);
  const asistenciaData = useMemo(
    () =>
      (data?.asistencia_por_segmento.slice(0, 10) ?? []).map((item) => ({
        ...item,
        segmento: translateSegmentLabel(locale, item.segmento),
      })),
    [data, locale],
  );
  const consumoData = useMemo(
    () =>
      (data?.consumo_por_segmento.slice(0, 10) ?? []).map((item) => ({
        ...item,
        segmento: translateSegmentLabel(locale, item.segmento),
      })),
    [data, locale],
  );
  const rankingData = useMemo(
    () =>
      (data?.ranking_productos_servicios.slice(0, 8) ?? []).map((item) => ({
        ...item,
        tipo: translateRankingType(locale, item.tipo),
        segmento: translateSegmentLabel(locale, item.segmento),
      })),
    [data, locale],
  );
  const promocionesData = useMemo(
    () =>
      (data?.promociones_sugeridas ?? []).map((item) => ({
        ...item,
        titulo: translatePromotionTitle(locale, item.titulo),
        descripcion: translatePromotionDescription(locale, item),
        segmento: translateSegmentLabel(locale, item.segmento),
        accion_sugerida: translatePromotionAction(locale, item.accion_sugerida),
        prioridad: translatePriority(locale, item.prioridad),
      })),
    [data, locale],
  );

  const biSociosPromocionesExportFileName =
    locale === "en"
      ? "members-bi-demographics-promotions"
      : "bi-socios-demografia-promociones";

  const handleExportExcel = async () => {
    if (!data) return;

    const exportFileBaseName =
      locale === "en"
        ? "members-bi-demographics-promotions"
        : "bi-socios-demografia-promociones";

    const workbook = new ExcelJS.Workbook();
    const resumen = workbook.addWorksheet(c("Resumen", "Summary"));
    resumen.columns = [
      { header: c("Métrica", "Metric"), key: "metrica", width: 34 },
      { header: c("Valor", "Value"), key: "valor", width: 18 },
    ];
    resumen.addRows([
      {
        metrica: c("Total socios", "Total members"),
        valor: data.metricas.total_socios,
      },
      {
        metrica: c("Socios activos", "Active members"),
        valor: data.metricas.socios_activos,
      },
      { metrica: c("Hombres", "Men"), valor: data.metricas.hombres },
      { metrica: c("Mujeres", "Women"), valor: data.metricas.mujeres },
      {
        metrica: c("Edad promedio", "Average age"),
        valor: data.metricas.edad_promedio ?? "-",
      },
      {
        metrica: c("Altas período", "Period sign-ups"),
        valor: data.metricas.altas_periodo,
      },
      {
        metrica: c("Asistencias período", "Period attendance"),
        valor: data.metricas.asistencias_periodo,
      },
      {
        metrica: c("Pagos período", "Period payments"),
        valor: data.metricas.pagos_periodo,
      },
      {
        metrica: c("Consumo período", "Period consumption"),
        valor: data.metricas.consumo_periodo,
      },
    ]);

    const franjas = workbook.addWorksheet(c("Franjas etarias", "Age ranges"));
    franjas.columns = [
      { header: c("Franja", "Age range"), key: "franja", width: 24 },
      { header: c("Socios", "Members"), key: "cantidad_socios", width: 12 },
      {
        header: c("% socios", "% members"),
        key: "porcentaje_socios",
        width: 12,
      },
      { header: c("Hombres", "Men"), key: "hombres", width: 12 },
      { header: c("Mujeres", "Women"), key: "mujeres", width: 12 },
      { header: c("Altas", "Sign-ups"), key: "altas_periodo", width: 12 },
      {
        header: c("Asistencias", "Attendance"),
        key: "asistencias_periodo",
        width: 14,
      },
      { header: c("Pagos", "Payments"), key: "pagos_periodo", width: 18 },
      {
        header: c("Consumo", "Consumption"),
        key: "consumo_periodo",
        width: 18,
      },
    ];
    data.franjas_etarias.forEach((item) =>
      franjas.addRow({
        ...item,
        franja: translateAgeBand(locale, item.franja),
      }),
    );

    const ranking = workbook.addWorksheet(
      c("Ranking consumo", "Consumption ranking"),
    );
    ranking.columns = [
      { header: "Item", key: "item", width: 34 },
      { header: c("Tipo", "Type"), key: "tipo", width: 14 },
      { header: c("Segmento", "Segment"), key: "segmento", width: 34 },
      { header: c("Cantidad", "Quantity"), key: "cantidad", width: 12 },
      { header: "Total", key: "total", width: 18 },
    ];
    data.ranking_productos_servicios.forEach((item) =>
      ranking.addRow({
        ...item,
        tipo: translateRankingType(locale, item.tipo),
        segmento: translateSegmentLabel(locale, item.segmento),
      }),
    );

    const promociones = workbook.addWorksheet(
      c("Promociones sugeridas", "Suggested promotions"),
    );
    promociones.columns = [
      { header: c("Título", "Title"), key: "titulo", width: 36 },
      { header: c("Segmento", "Segment"), key: "segmento", width: 32 },
      { header: c("Prioridad", "Priority"), key: "prioridad", width: 12 },
      {
        header: c("Acción sugerida", "Suggested action"),
        key: "accion_sugerida",
        width: 60,
      },
    ];
    data.promociones_sugeridas.forEach((item) =>
      promociones.addRow({
        ...item,
        titulo: translatePromotionTitle(locale, item.titulo),
        descripcion: translatePromotionDescription(locale, item),
        segmento: translateSegmentLabel(locale, item.segmento),
        accion_sugerida: translatePromotionAction(locale, item.accion_sugerida),
        prioridad: translatePriority(locale, item.prioridad),
      }),
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName(exportFileBaseName, "xlsx");
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!data) return;

    const exportFileBaseName =
      locale === "en"
        ? "members-bi-demographics-promotions"
        : "bi-socios-demografia-promociones";

    try {
      await downloadCommercialReportPdf({
        locale,
        title: c("BI Socios", "Members BI"),
        subtitle: c(
          "Demografía, asistencia, consumo y oportunidades comerciales.",
          "Demographics, attendance, consumption, and commercial opportunities.",
        ),
        fileName: exportFileBaseName,
        footerText: c(
          "Documento generado por Gym Master.",
          "Document generated by Gym Master.",
        ),
        labels: {
          generated: c("Generado", "Generated"),
          page: c("Página", "Page"),
          of: c("de", "of"),
          detail: c("Detalle", "Details"),
          records: c("registros", "records"),
          empty: c(
            "Sin datos para el período seleccionado.",
            "No data for the selected period.",
          ),
        },
        rows: data.franjas_etarias,
        metrics: [
          {
            label: c("Socios", "Members"),
            value: formatNumber(data.metricas.total_socios),
          },
          {
            label: c("Hombres", "Men"),
            value:
              String(formatNumber(data.metricas.hombres)) +
              " (" +
              formatPercent(data.metricas.porcentaje_hombres) +
              ")",
          },
          {
            label: c("Mujeres", "Women"),
            value:
              String(formatNumber(data.metricas.mujeres)) +
              " (" +
              formatPercent(data.metricas.porcentaje_mujeres) +
              ")",
          },
          {
            label: c("Edad prom.", "Avg. age"),
            value: formatAge(locale, data.metricas.edad_promedio),
          },
        ],
        filtersLabel:
          c("Período", "Period") +
          ": " +
          formatFrontendDate(data.desde) +
          " " +
          c("al", "to") +
          " " +
          formatFrontendDate(data.hasta),
        charts: [
          {
            title: c("Socios por franja etaria", "Members by age range"),
            kind: "bars",
            data: data.franjas_etarias.map((item) => ({
              ...item,
              franja: translateAgeBand(locale, item.franja),
            })),
            labelKey: "franja",
            series: [
              {
                key: "cantidad_socios",
                label: c("Socios", "Members"),
                color: [2, 132, 199],
              },
            ],
          },
          {
            title: c("Altas mensuales", "Monthly sign-ups"),
            kind: "line",
            data: data.altas_mensuales.map((item) => ({ ...item })),
            labelKey: "periodo_label",
            series: [
              {
                key: "total",
                label: c("Altas", "Sign-ups"),
                color: [22, 163, 74],
              },
            ],
          },
        ],
        columns: [
          {
            header: c("Franja", "Age range"),
            width: 34,
            getValue: (row) => translateAgeBand(locale, row.franja),
          },
          {
            header: c("Socios", "Members"),
            width: 22,
            getValue: (row) => row.cantidad_socios,
            align: "right",
          },
          {
            header: "%",
            width: 18,
            getValue: (row) => formatPercent(row.porcentaje_socios),
            align: "right",
          },
          {
            header: c("Hombres", "Men"),
            width: 22,
            getValue: (row) => row.hombres,
            align: "right",
          },
          {
            header: c("Mujeres", "Women"),
            width: 22,
            getValue: (row) => row.mujeres,
            align: "right",
          },
          {
            header: c("Altas", "Sign-ups"),
            width: 22,
            getValue: (row) => row.altas_periodo,
            align: "right",
          },
          {
            header: c("Asist.", "Attendance"),
            width: 22,
            getValue: (row) => row.asistencias_periodo,
            align: "right",
          },
          {
            header: c("Consumo", "Consumption"),
            width: 28,
            getValue: (row) => formatCurrencyARS(row.consumo_periodo),
            align: "right",
          },
        ],
      });
    } catch {
      toast.error(
        c(
          "No se pudo generar el PDF de BI de socios",
          "Unable to generate the members BI PDF",
        ),
      );
    }
  };

  if (!isInitialized) return <div>{c("Cargando...", "Loading...")}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader
            title={c("BI Socios / Promociones", "Members / Promotions BI")}
          />
          <main className="flex-1 space-y-6 bg-slate-50 p-6 dark:bg-neutral-950">
            <section className="rounded-2xl border bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                    {c(
                      "Business Intelligence comercial",
                      "Commercial business intelligence",
                    )}
                  </p>
                  <h1 className="text-2xl font-bold">
                    {c(
                      "Socios, demografía y promociones",
                      "Members, demographics, and promotions",
                    )}
                  </h1>
                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {c(
                      "Analizá género, edad, altas, asistencia, pagos y consumo para tomar decisiones comerciales basadas en datos reales del gimnasio.",
                      "Analyze gender, age, sign-ups, attendance, payments, and consumption to make commercial decisions based on real gym data.",
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/socios">
                      {c("Socios", "Members")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/finanzas">
                      {c("Finanzas", "Finance")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/notificaciones">
                      {c("Campañas", "Campaigns")}
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 lg:max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-desde">
                      {c("Fecha desde", "Date from")}
                    </Label>
                    <Input
                      id="fecha-desde"
                      type="date"
                      value={desde}
                      onChange={(event) => setDesde(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-hasta">
                      {c("Fecha hasta", "Date to")}
                    </Label>
                    <Input
                      id="fecha-hasta"
                      type="date"
                      value={hasta}
                      onChange={(event) => setHasta(event.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={loadData}
                    disabled={loading}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {loading
                      ? c("Actualizando...", "Refreshing...")
                      : c("Actualizar", "Refresh")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={!data}
                    className="border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {c("Descargar PDF", "Download PDF")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportExcel}
                    disabled={!data}
                    className="border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {c("Exportar", "Export")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title={c("Socios activos", "Active members")}
                value={
                  loading || !metricas
                    ? "..."
                    : formatNumber(metricas.socios_activos)
                }
                description={`${metricas ? formatNumber(metricas.total_socios) : "-"} ${c("socios totales", "total members")}`}
                icon={Users}
                tone="blue"
              />
              <MetricCard
                title={c("Distribución", "Distribution")}
                value={
                  loading || !metricas
                    ? "..."
                    : `${formatPercent(metricas.porcentaje_hombres)} / ${formatPercent(metricas.porcentaje_mujeres)}`
                }
                description={c(
                  "Hombres / mujeres registrados.",
                  "Registered men / women.",
                )}
                icon={VenusAndMars}
                tone="pink"
              />
              <MetricCard
                title={c("Edad promedio", "Average age")}
                value={
                  loading || !metricas
                    ? "..."
                    : formatAge(locale, metricas.edad_promedio)
                }
                description={`${metricas ? formatNumber(metricas.altas_periodo) : "-"} ${c("altas en el período", "sign-ups in the period")}`}
                icon={CalendarDays}
                tone="green"
              />
              <MetricCard
                title={c("Consumo socio", "Member consumption")}
                value={
                  loading || !metricas
                    ? "..."
                    : formatCurrencyARS(metricas.consumo_periodo)
                }
                description={`${metricas ? formatNumber(metricas.asistencias_periodo) : "-"} ${c("asistencias analizadas", "attendances analyzed")}`}
                icon={WalletCards}
                tone="warning"
              />
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Percent className="h-5 w-5 text-sky-600" />
                    {c("Género", "Gender")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {generoData.length === 0 ? (
                    <EmptyChart
                      label={c(
                        "Sin datos de género para graficar.",
                        "No gender data to chart.",
                      )}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={generoData}
                          dataKey="cantidad"
                          nameKey="label"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={3}
                          label
                        >
                          {generoData.map((_, index) => (
                            <Cell
                              key={`genero-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatNumber(Number(value))}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100 xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-sky-600" />
                    {c("Franjas etarias", "Age ranges")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {franjasData.length === 0 ? (
                    <EmptyChart
                      label={c(
                        "Sin franjas etarias para graficar.",
                        "No age ranges to chart.",
                      )}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={franjasData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="franja" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="hombres"
                          name={c("Hombres", "Men")}
                          stackId="a"
                          fill="#0284c7"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="mujeres"
                          name={c("Mujeres", "Women")}
                          stackId="a"
                          fill="#ec4899"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="sin_genero"
                          name={c("Sin dato", "No data")}
                          stackId="a"
                          fill="#64748b"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-sky-600" />
                    {c("Altas mensuales", "Monthly sign-ups")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {altasData.length === 0 ? (
                    <EmptyChart
                      label={c(
                        "No hay altas para el período seleccionado.",
                        "No sign-ups for the selected period.",
                      )}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={altasData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo_label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          name={c("Altas", "Sign-ups")}
                          stroke="#16a34a"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Megaphone className="h-5 w-5 text-sky-600" />
                    {c("Asistencia por segmento", "Attendance by segment")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  {asistenciaData.length === 0 ? (
                    <EmptyChart
                      label={c(
                        "Sin asistencias segmentadas para el período.",
                        "No segmented attendance for the period.",
                      )}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={asistenciaData}
                        layout="vertical"
                        margin={{ left: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="segmento" width={130} />
                        <Tooltip />
                        <Bar
                          dataKey="asistencias"
                          name={c("Asistencias", "Attendance")}
                          fill="#7c3aed"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {c("Consumo por segmento", "Consumption by segment")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {consumoData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {c(
                        "No hay ventas asociadas a socios para el período.",
                        "No sales associated with members for the period.",
                      )}
                    </p>
                  ) : (
                    consumoData.map((item) => (
                      <div
                        key={item.segmento}
                        className="rounded-xl border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.segmento}</p>
                            <p className="text-xs text-muted-foreground">
                              {biSalesCount(locale, item.cantidad_ventas)}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatCurrencyARS(item.total)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {c(
                      "Ranking productos / servicios",
                      "Product / service ranking",
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rankingData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {c(
                        "No hay detalle de productos o servicios consumidos por socios.",
                        "No product or service consumption details for members.",
                      )}
                    </p>
                  ) : (
                    rankingData.map((item) => (
                      <div
                        key={`${item.tipo}-${item.item}-${item.segmento}`}
                        className="rounded-xl border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.item}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.tipo} · {item.segmento} ·{" "}
                              {formatNumber(item.cantidad)}{" "}
                              {c("unidades", "units")}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatCurrencyARS(item.total)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>

            <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Megaphone className="h-5 w-5 text-sky-600" />
                  {c("Promociones sugeridas", "Suggested promotions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {promocionesData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {c(
                      "No hay sugerencias suficientes para el período seleccionado.",
                      "There are not enough suggestions for the selected period.",
                    )}
                  </p>
                ) : (
                  promocionesData.map((item) => (
                    <div
                      key={`${item.titulo}-${item.segmento}`}
                      className="rounded-2xl border bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.titulo}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.descripcion}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                          {item.prioridad}
                        </span>
                      </div>
                      <p className="mt-3 text-sm">
                        <strong>{c("Segmento:", "Segment:")}</strong>{" "}
                        {item.segmento}
                      </p>
                      <p className="mt-1 text-sm">
                        <strong>{c("Acción:", "Action:")}</strong>{" "}
                        {item.accion_sugerida}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
              <CardHeader>
                <CardTitle className="text-lg">
                  {c("Resumen por franja etaria", "Summary by age range")}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left dark:border-neutral-800 dark:bg-neutral-900/80">
                      <th className="p-3">{c("Franja", "Age range")}</th>
                      <th className="p-3 text-right">
                        {c("Socios", "Members")}
                      </th>
                      <th className="p-3 text-right">%</th>
                      <th className="p-3 text-right">{c("Hombres", "Men")}</th>
                      <th className="p-3 text-right">
                        {c("Mujeres", "Women")}
                      </th>
                      <th className="p-3 text-right">
                        {c("Edad prom.", "Avg. age")}
                      </th>
                      <th className="p-3 text-right">
                        {c("Altas", "Sign-ups")}
                      </th>
                      <th className="p-3 text-right">
                        {c("Asistencias", "Attendance")}
                      </th>
                      <th className="p-3 text-right">
                        {c("Pagos", "Payments")}
                      </th>
                      <th className="p-3 text-right">
                        {c("Consumo", "Consumption")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {franjasData.map((item) => (
                      <tr
                        key={item.franja}
                        className="border-b dark:border-neutral-800"
                      >
                        <td className="p-3 font-medium">{item.franja}</td>
                        <td className="p-3 text-right">
                          {formatNumber(item.cantidad_socios)}
                        </td>
                        <td className="p-3 text-right">
                          {formatPercent(item.porcentaje_socios)}
                        </td>
                        <td className="p-3 text-right">
                          {formatNumber(item.hombres)}
                        </td>
                        <td className="p-3 text-right">
                          {formatNumber(item.mujeres)}
                        </td>
                        <td className="p-3 text-right">
                          {formatAge(locale, item.edad_promedio)}
                        </td>
                        <td className="p-3 text-right">
                          {formatNumber(item.altas_periodo)}
                        </td>
                        <td className="p-3 text-right">
                          {formatNumber(item.asistencias_periodo)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrencyARS(item.pagos_periodo)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrencyARS(item.consumo_periodo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
