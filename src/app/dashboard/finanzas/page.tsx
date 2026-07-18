"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  TrendingUp,
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
import { FinanzasDashboardResponse } from "@/interfaces/finanzas.interface";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { useAuthStore } from "@/stores/authStore";
import { getFinanzasDashboardBi } from "@/services/finanzasService";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import { formatFrontendDate } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfCurrentYearISO() {
  return `${new Date().getFullYear()}-01-01`;
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toFixed(1)}%`;
}

function financeTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeFinanceText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const FINANCE_DYNAMIC_TRANSLATIONS: Record<string, string> = {
  "ventas de productos / kiosco": "Product / kiosk sales",
  "fees / membresias": "Fees / memberships",
  "compras a proveedores": "Supplier purchases",
  "gastos pending": "Pending expenses",
  "gastos pendientes": "Pending expenses",
  "luz": "Electricity",
};

function translateFinanceCategory(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const normalized = normalizeFinanceText(raw);
  if (FINANCE_DYNAMIC_TRANSLATIONS[normalized]) {
    return FINANCE_DYNAMIC_TRANSLATIONS[normalized];
  }

  const demoExpenseMatch = normalized.match(/^gasto demo (.+)$/);
  if (demoExpenseMatch) {
    return `Demo expense ${demoExpenseMatch[1]}`;
  }

  if (normalized.includes("gasto") && normalized.includes("demo")) {
    return raw.replace(/gasto demo/gi, "Demo expense").replace(/gasto/gi, "Expense");
  }

  return raw;
}

function translateFinanceKind(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw || locale !== "en") return raw;

  const normalized = normalizeFinanceText(raw);
  const dictionary: Record<string, string> = {
    ingreso: "Income",
    ingresos: "Income",
    egreso: "Outflow",
    egresos: "Outflow",
    gasto: "Expense",
    gastos: "Expense",
    compra: "Purchase",
    compras: "Purchases",
    compromiso: "Commitment",
    compromisos: "Commitments",
    pendiente: "Pending",
    pendientes: "Pending",
    vencido: "Overdue",
    vencidos: "Overdue",
    cuotas: "Fees",
    cuota: "Fee",
    ventas: "Sales",
    venta: "Sale",
    servicios: "Services",
    servicio: "Service",
  };

  return dictionary[normalized] ?? translateFinanceCategory(locale, raw);
}

function financeRecordCount(locale: GymMasterLocale, count: number) {
  if (locale === "en") {
    return `${count} ${count === 1 ? "record" : "records"}`;
  }

  return `${count} ${count === 1 ? "registro" : "registros"}`;
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
  tone?: "default" | "income" | "expense" | "warning" | "result";
}) {
  const toneClass = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
    income: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    expense: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    result: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
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

function CategoryList({
  title,
  items,
  emptyLabel,
  locale,
}: {
  title: string;
  items: Array<{ categoria: string; total: number; cantidad: number }>;
  emptyLabel: string;
  locale: GymMasterLocale;
}) {
  return (
    <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.slice(0, 8).map((item) => (
            <div
              key={`${title}-${item.categoria}`}
              className="rounded-xl border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{translateFinanceCategory(locale, item.categoria)}</p>
                  <p className="text-xs text-muted-foreground">
                    {financeRecordCount(locale, item.cantidad)}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrencyARS(item.total)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function FinanzasIngresosEgresosBiPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const { locale } = useI18n();
  const c = (es: string, en: string) => financeTx(locale, es, en);
  const router = useRouter();
  const [desde, setDesde] = useState(firstDayOfCurrentYearISO());
  const [hasta, setHasta] = useState(todayISO());
  const [data, setData] = useState<FinanzasDashboardResponse | null>(null);
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
      const response = await getFinanzasDashboardBi({ desde, hasta });
      setData(response);
    } catch (error: any) {
      toast.error(error.message || c("No se pudo cargar el BI financiero", "Unable to load financial BI"));
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

  const chartData = useMemo(() => data?.serie_mensual ?? [], [data]);
  const metricas = data?.metricas;
  const financialSignal = useMemo(() => {
    if (!metricas) {
      return {
        label: c("Sin datos financieros", "No financial data"),
        description:
          c("Seleccioná un período y actualizá para generar una lectura ejecutiva.", "Select a period and refresh to generate an executive summary."),
        tone: "neutral" as const,
      };
    }

    if (metricas.resultado_neto < 0) {
      return {
        label: c("Resultado negativo", "Negative result"),
        description:
          c("Revisá egresos y compromisos pendientes antes de ampliar gastos operativos.", "Review outflows and pending commitments before increasing operating expenses."),
        tone: "danger" as const,
      };
    }

    if (metricas.compromisos_pendientes > metricas.ingresos_total * 0.35) {
      return {
        label: c("Compromisos altos", "High commitments"),
        description:
          c("Hay obligaciones relevantes frente a los ingresos del período. Priorizá pagos críticos.", "There are significant obligations compared with period income. Prioritize critical payments."),
        tone: "warning" as const,
      };
    }

    return {
      label: c("Operación financieramente estable", "Financially stable operation"),
      description:
        c("El resultado neto acompaña la operación comercial. Mantener seguimiento mensual.", "Net result supports the commercial operation. Keep monthly monitoring."),
      tone: "success" as const,
    };
  }, [c, metricas]);

  const handleExportExcel = async () => {
    if (!data) return;

    const exportFileBaseName =
      locale === "en" ? "finance-bi-income-outflows" : "bi-finanzas-ingresos-egresos";

    const translateFinanceExcelType = (value: unknown) => {
      const raw = String(value ?? "").trim();
      if (locale !== "en") return raw;

      const normalized = raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (normalized.includes("ingreso")) return "Income";
      if (normalized.includes("egreso")) return "Outflow";
      if (normalized.includes("pendiente")) return "Pending";
      if (normalized.includes("compromiso")) return "Commitment";

      return raw;
    };

    const workbook = new ExcelJS.Workbook();
    const resumen = workbook.addWorksheet(
      locale === "en" ? "Monthly summary" : "Resumen mensual",
    );

    resumen.columns = [
      { header: c("Período", "Period"), key: "periodo", width: 16 },
      { header: c("Ingresos cuotas", "Fee income"), key: "ingresos_cuotas", width: 18 },
      { header: c("Ingresos ventas", "Sales income"), key: "ingresos_ventas", width: 18 },
      { header: c("Ingresos servicios", "Service income"), key: "ingresos_servicios", width: 18 },
      { header: c("Ingresos total", "Total income"), key: "ingresos_total", width: 18 },
      { header: c("Egresos compras", "Purchase outflows"), key: "egresos_compras", width: 18 },
      { header: c("Egresos gastos", "Expense outflows"), key: "egresos_gastos", width: 18 },
      { header: c("Egresos total", "Total outflows"), key: "egresos_total", width: 18 },
      { header: c("Resultado neto", "Net result"), key: "resultado_neto", width: 18 },
    ];

    data.serie_mensual.forEach((item) => resumen.addRow(item));

    const categorias = workbook.addWorksheet(
      locale === "en" ? "Categories" : "Categorías",
    );
    categorias.columns = [
      { header: c("Tipo", "Type"), key: "tipo", width: 16 },
      { header: c("Categoría", "Category"), key: "categoria", width: 34 },
      { header: c("Cantidad", "Quantity"), key: "cantidad", width: 12 },
      { header: c("Total", "Total"), key: "total", width: 18 },
    ];

    [
      ...data.ingresos_por_categoria,
      ...data.egresos_por_categoria,
      ...data.compromisos_por_categoria,
    ].forEach((item) => {
      categorias.addRow({
        ...item,
        tipo: translateFinanceExcelType(item.tipo),
        categoria: translateFinanceCategory(locale, item.categoria),
      });
    });

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
      locale === "en" ? "finance-bi-income-outflows" : "bi-finanzas-ingresos-egresos";

    try {
      await downloadCommercialReportPdf({
        locale,
        title: c("BI Finanzas", "Finance BI"),
        subtitle: c(
          "Ingresos, egresos, resultado neto y compromisos del gimnasio.",
          "Income, outflows, net result, and gym commitments.",
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
            "No hay registros para el período seleccionado.",
            "No records for the selected period.",
          ),
        },
        rows: data.serie_mensual,
        metrics: [
          {
            label: c("Ingresos", "Income"),
            value: formatCurrencyARS(data.metricas.ingresos_total),
          },
          {
            label: c("Egresos", "Outflows"),
            value: formatCurrencyARS(data.metricas.egresos_total),
          },
          {
            label: c("Resultado", "Result"),
            value: formatCurrencyARS(data.metricas.resultado_neto),
          },
          {
            label: c("Pendientes", "Pending"),
            value: formatCurrencyARS(data.metricas.compromisos_pendientes),
          },
        ],
        filtersLabel:
          locale === "en"
            ? `Period: ${formatFrontendDate(data.desde)} to ${formatFrontendDate(data.hasta)}`
            : `Período: ${formatFrontendDate(data.desde)} al ${formatFrontendDate(data.hasta)}`,
        charts: [
          {
            title: c(
              "Evolución mensual: ingresos vs egresos",
              "Monthly evolution: income vs outflows",
            ),
            kind: "bars",
            data: data.serie_mensual.map((item) => ({ ...item })) as Record<
              string,
              string | number | null | undefined
            >[],
            labelKey: "periodo_label",
            series: [
              {
                key: "ingresos_total",
                label: c("Ingresos", "Income"),
                color: [22, 163, 74],
              },
              {
                key: "egresos_total",
                label: c("Egresos", "Outflows"),
                color: [220, 38, 38],
              },
            ],
          },
          {
            title: c("Resultado neto mensual", "Monthly net result"),
            kind: "line",
            data: data.serie_mensual.map((item) => ({ ...item })) as Record<
              string,
              string | number | null | undefined
            >[],
            labelKey: "periodo_label",
            series: [
              {
                key: "resultado_neto",
                label: c("Resultado", "Result"),
                color: [2, 132, 199],
              },
            ],
          },
        ],
        columns: [
          {
            header: c("Período", "Period"),
            width: 22,
            getValue: (row) => row.periodo_label,
          },
          {
            header: c("Ingresos", "Income"),
            width: 28,
            getValue: (row) => formatCurrencyARS(row.ingresos_total),
            align: "right",
          },
          {
            header: c("Egresos", "Outflows"),
            width: 28,
            getValue: (row) => formatCurrencyARS(row.egresos_total),
            align: "right",
          },
          {
            header: c("Resultado", "Result"),
            width: 30,
            getValue: (row) => formatCurrencyARS(row.resultado_neto),
            align: "right",
          },
          {
            header: c("Cuotas", "Fees"),
            width: 26,
            getValue: (row) => formatCurrencyARS(row.ingresos_cuotas),
            align: "right",
          },
          {
            header: c("Ventas", "Sales"),
            width: 26,
            getValue: (row) => formatCurrencyARS(row.ingresos_ventas),
            align: "right",
          },
          {
            header: c("Compras", "Purchases"),
            width: 26,
            getValue: (row) => formatCurrencyARS(row.egresos_compras),
            align: "right",
          },
          {
            header: c("Gastos", "Expenses"),
            width: 26,
            getValue: (row) => formatCurrencyARS(row.egresos_gastos),
            align: "right",
          },
        ],
      });
    } catch {
      toast.error(c("No se pudo generar el PDF financiero", "Unable to generate the financial PDF"));
    }
  };

  if (!isInitialized) return <div>{c("Cargando...", "Loading...")}</div>;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="!grid !min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <AppHeader title={c("Finanzas / BI", "Finance / BI")} />
          <main className="min-h-0 space-y-6 overflow-y-auto overflow-x-hidden p-4 pb-8 dark:bg-black sm:p-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-cyan-300">
                    {c("Business Intelligence financiero", "Financial business intelligence")}
                  </p>
                  <h1 className="text-2xl font-bold">
                    {c("Ingresos, egresos y resultado neto", "Income, outflows, and net result")}
                  </h1>
                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {c("Consolidá cuotas, ventas, compras y gastos para obtener una vista financiera operativa del gimnasio.", "Consolidate fees, sales, purchases, and expenses to get an operational financial view of the gym.")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/comercial">{c("Comercial", "Commercial")}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/pagos">{c("Pagos", "Payments")}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/otros-gastos">{c("Gastos", "Expenses")}</Link>
                  </Button>
                </div>
              </div>
            </section>

            <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 lg:max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-desde">{c("Fecha desde", "Date from")}</Label>
                    <Input
                      id="fecha-desde"
                      type="date"
                      value={desde}
                      onChange={(event) => setDesde(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-hasta">{c("Fecha hasta", "Date to")}</Label>
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
                    {loading ? c("Actualizando...", "Refreshing...") : c("Actualizar", "Refresh")}
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
                title={c("Ingresos totales", "Total income")}
                value={
                  loading || !metricas
                    ? "..."
                    : formatCurrencyARS(metricas.ingresos_total)
                }
                description={c("Cuotas, ventas y servicios vendidos.", "Fees, sales, and services sold.")}
                icon={ArrowUpCircle}
                tone="income"
              />
              <MetricCard
                title={c("Egresos totales", "Total outflows")}
                value={
                  loading || !metricas
                    ? "..."
                    : formatCurrencyARS(metricas.egresos_total)
                }
                description={c("Compras pagadas y gastos pagados.", "Paid purchases and paid expenses.")}
                icon={ArrowDownCircle}
                tone="expense"
              />
              <MetricCard
                title={c("Resultado neto", "Net result")}
                value={
                  loading || !metricas
                    ? "..."
                    : formatCurrencyARS(metricas.resultado_neto)
                }
                description={`${c("Margen operativo", "Operating margin")}: ${metricas ? formatPercent(metricas.margen_resultado_porcentaje) : "-"}`}
                icon={TrendingUp}
                tone="result"
              />
              <MetricCard
                title={c("Compromisos pendientes", "Pending commitments")}
                value={
                  loading || !metricas
                    ? "..."
                    : formatCurrencyARS(metricas.compromisos_pendientes)
                }
                description={c("Compras pendientes y gastos pendientes/vencidos.", "Pending purchases and pending/overdue expenses.")}
                icon={AlertTriangle}
                tone="warning"
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="border-sky-200 bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-950 text-white shadow-lg dark:border-sky-900">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                        {c("Lectura ejecutiva financiera", "Financial executive summary")}
                      </p>
                      <h2 className="mt-2 text-xl font-bold">
                        {financialSignal.label}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-cyan-50/80">
                        {financialSignal.description}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${financialSignal.tone === "danger" ? "bg-red-500/20 text-red-100" : financialSignal.tone === "warning" ? "bg-amber-500/20 text-amber-100" : financialSignal.tone === "success" ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-white"}`}
                    >
                      {metricas
                        ? formatPercent(metricas.margen_resultado_porcentaje)
                        : c("Sin margen", "No margin")}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100/70">
                        {c("Ventas registradas", "Registered sales")}
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {metricas ? metricas.cantidad_ventas : 0}
                      </p>
                      <p className="mt-1 text-xs text-cyan-50/70">
                        {c("Operaciones comerciales del período.", "Commercial operations in the period.")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100/70">
                        {c("Pagos de cuotas", "Fee payments")}
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {metricas ? metricas.cantidad_pagos : 0}
                      </p>
                      <p className="mt-1 text-xs text-cyan-50/70">
                        {c("Base recurrente del gimnasio.", "Recurring base of the gym.")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-100/70">
                        {c("Compras/Gastos", "Purchases/Expenses")}
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {metricas
                          ? metricas.cantidad_compras + metricas.cantidad_gastos
                          : 0}
                      </p>
                      <p className="mt-1 text-xs text-cyan-50/70">
                        {c("Salidas operativas registradas.", "Registered operating outflows.")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-neutral-100">
                <CardContent className="space-y-3 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                    {c("Decisión sugerida", "Suggested decision")}
                  </p>
                  <h3 className="text-lg font-bold">
                    {c("Conectar reportes con caja, stock y comercial", "Connect reports with cash, stock, and commercial")}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {c("Usá este panel para validar si el crecimiento de ventas acompaña el margen neto y si los compromisos pendientes no comprometen reposición o sueldos.", "Use this panel to validate whether sales growth supports net margin and whether pending commitments affect replenishment or salaries.")}
                  </p>
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div className="rounded-xl border bg-background p-3">
                      {c("Ingresos", "Income")}:{" "}
                      {metricas
                        ? formatCurrencyARS(metricas.ingresos_total)
                        : "-"}
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      {c("Egresos", "Outflows")}:{" "}
                      {metricas
                        ? formatCurrencyARS(metricas.egresos_total)
                        : "-"}
                    </div>
                    <div className="rounded-xl border bg-background p-3">
                      {c("Pendientes", "Pending")}:{" "}
                      {metricas
                        ? formatCurrencyARS(metricas.compromisos_pendientes)
                        : "-"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100 xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <WalletCards className="h-5 w-5 text-sky-600 dark:text-cyan-300" />
                    {c("Evolución mensual", "Monthly evolution")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {c("No hay datos financieros para el período seleccionado.", "No financial data for the selected period.")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo_label" />
                        <YAxis
                          tickFormatter={(value) => `$${Number(value) / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value) =>
                            formatCurrencyARS(Number(value))
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="ingresos_total"
                          name={c("Ingresos", "Income")}
                          fill="#16a34a"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="egresos_total"
                          name={c("Egresos", "Outflows")}
                          fill="#dc2626"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5 text-sky-600 dark:text-cyan-300" />
                    {c("Resultado neto", "Net result")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[360px]">
                  {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {c("Sin resultados para graficar.", "No results to chart.")}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo_label" />
                        <YAxis
                          tickFormatter={(value) => `$${Number(value) / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value) =>
                            formatCurrencyARS(Number(value))
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="resultado_neto"
                          name={c("Resultado", "Result")}
                          stroke="#0284c7"
                          fill="#e0f2fe"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <CategoryList
                title={c("Ingresos por categoría", "Income by category")}
                items={data?.ingresos_por_categoria ?? []}
                emptyLabel={c("No hay ingresos para el período.", "No income for the selected period.")}
                locale={locale}
              />
              <CategoryList
                title={c("Egresos por categoría", "Outflows by category")}
                items={data?.egresos_por_categoria ?? []}
                emptyLabel={c("No hay egresos para el período.", "No outflows for the selected period.")}
                locale={locale}
              />
              <CategoryList
                title={c("Pendientes y vencidos", "Pending and overdue")}
                items={data?.compromisos_por_categoria ?? []}
                emptyLabel={c("No hay compromisos pendientes para el período.", "No pending commitments for the selected period.")}
                locale={locale}
              />
            </section>

            <Card className="bg-white dark:border-neutral-800 dark:bg-neutral-950/90 dark:text-neutral-100">
              <CardHeader>
                <CardTitle className="text-lg">
                  {c("Resumen mensual detallado", "Detailed monthly summary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left dark:border-neutral-800 dark:bg-neutral-900">
                      <th className="p-3">{c("Período", "Period")}</th>
                      <th className="p-3 text-right">{c("Cuotas", "Fees")}</th>
                      <th className="p-3 text-right">{c("Ventas", "Sales")}</th>
                      <th className="p-3 text-right">{c("Servicios", "Services")}</th>
                      <th className="p-3 text-right">{c("Ingresos", "Income")}</th>
                      <th className="p-3 text-right">{c("Compras", "Purchases")}</th>
                      <th className="p-3 text-right">{c("Gastos", "Expenses")}</th>
                      <th className="p-3 text-right">{c("Egresos", "Outflows")}</th>
                      <th className="p-3 text-right">{c("Resultado", "Result")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-6 text-center text-muted-foreground"
                        >
                          {c("No hay registros para el período seleccionado.", "No records for the selected period.")}
                        </td>
                      </tr>
                    ) : (
                      chartData.map((item) => (
                        <tr key={item.periodo} className="border-b dark:border-neutral-800">
                          <td className="p-3 font-medium">
                            {item.periodo_label}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrencyARS(item.ingresos_cuotas)}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrencyARS(item.ingresos_ventas)}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrencyARS(item.ingresos_servicios)}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrencyARS(item.ingresos_total)}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrencyARS(item.egresos_compras)}
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrencyARS(item.egresos_gastos)}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrencyARS(item.egresos_total)}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrencyARS(item.resultado_neto)}
                          </td>
                        </tr>
                      ))
                    )}
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
