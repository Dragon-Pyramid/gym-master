"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Plus, Search, WalletCards } from "lucide-react";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppHeader } from "@/components/header/AppHeader";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/PaginationControls";
import EmpleadoSueldoModal from "@/components/modal/EmpleadoSueldoModal";
import EmpleadoSueldoTable from "@/components/tables/EmpleadoSueldoTable";
import EmpleadoSueldoViewModal from "@/components/modal/EmpleadoSueldoViewModal";
import { Empleado } from "@/interfaces/empleado.interface";
import { EmpleadoSueldo, EmpleadoSueldoEstado } from "@/interfaces/empleado_sueldo.interface";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { anularEmpleadoSueldo, getEmpleadoSueldos, getEmpleados } from "@/services/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/i18n/I18nProvider";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import { formatFrontendDate } from "@/utils/dateFormat";

const PAGE_SIZE = 10;
type EstadoFilter = "todos" | EmpleadoSueldoEstado;

function salaryExportTx(locale: string, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeSalaryExportText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .replace(/\s*\/\s*/g, " / ");
}

const SALARY_EXPORT_DYNAMIC_TRANSLATIONS: Record<string, string> = {
  "sueldo mensual demo": "Demo monthly salary",
  "sueldo mensual": "Monthly salary",
  "liquidacion mensual": "Monthly payroll settlement",
  "ajuste sueldo": "Salary adjustment",
  "bono productividad": "Productivity bonus",
  "bono asistencia": "Attendance bonus",
  "descuento anticipo": "Advance discount",
};

const SALARY_PAYMENT_METHOD_EXPORT_TRANSLATIONS: Record<string, string> = {
  "efectivo": "Cash",
  "transferencia": "Bank transfer",
  "mercado pago": "Mercado Pago",
  "mercado_pago": "Mercado Pago",
  "stripe": "Stripe",
  "tarjeta debito": "Debit card",
  "tarjeta de debito": "Debit card",
  "tarjeta credito": "Credit card",
  "tarjeta de credito": "Credit card",
};

function translateSalaryExportText(locale: string, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (locale !== "en") return raw;
  return SALARY_EXPORT_DYNAMIC_TRANSLATIONS[normalizeSalaryExportText(raw)] ?? raw;
}

function salaryStatusExportLabel(locale: string, estado?: string | null) {
  const normalized = normalizeSalaryExportText(estado);

  if (["pagado", "paid"].includes(normalized)) {
    return salaryExportTx(locale, "Pagado", "Paid");
  }

  if (["pendiente", "pending"].includes(normalized)) {
    return salaryExportTx(locale, "Pendiente", "Pending");
  }

  if (["anulado", "cancelado", "void", "voided", "cancelled"].includes(normalized)) {
    return salaryExportTx(locale, "Anulado", "Voided");
  }

  return String(estado ?? "-");
}

function salaryPaymentMethodLabel(locale: string, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";
  if (locale !== "en") return raw;
  return SALARY_PAYMENT_METHOD_EXPORT_TRANSLATIONS[normalizeSalaryExportText(raw)] ?? raw;
}

function salaryConceptLabel(locale: string, value?: string | null) {
  return translateSalaryExportText(locale, value) || "-";
}


function estadoLabel(estado: EstadoFilter, locale = "es") {
  if (estado === "todos") return salaryExportTx(locale, "Todos", "All");
  return salaryStatusExportLabel(locale, estado);
}

function periodoInRange(periodo: string, desde: string, hasta: string) {
  const month = periodo.slice(0, 7);
  if (desde && month < desde) return false;
  if (hasta && month > hasta) return false;
  return true;
}

function sanitizeMonthFilterValue(value: string) {
  const cleaned = value.replace(/[^0-9-]/g, "").slice(0, 7);
  if (/^\d{5}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return cleaned;
}

type MonthFilterInputProps = {
  value: string;
  onChange: (value: string) => void;
  isEnglish: boolean;
  ariaLabel: string;
  placeholder: string;
};

function MonthFilterInput({ value, onChange, isEnglish, ariaLabel, placeholder }: MonthFilterInputProps) {
  return (
    <Input
      type={isEnglish ? "text" : "month"}
      lang={isEnglish ? "en" : "es"}
      inputMode={isEnglish ? "numeric" : undefined}
      pattern={isEnglish ? "[0-9]{4}-[0-9]{2}" : undefined}
      maxLength={isEnglish ? 7 : undefined}
      aria-label={ariaLabel}
      placeholder={placeholder}
      title={isEnglish ? "Use YYYY-MM format" : undefined}
      value={value}
      onChange={(event) => onChange(isEnglish ? sanitizeMonthFilterValue(event.target.value) : event.target.value)}
    />
  );
}

export default function EmpleadosSueldosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const salaryText = (es: string, en: string) => (isEnglish ? en : es);
  const router = useRouter();
  const [sueldos, setSueldos] = useState<EmpleadoSueldo[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [periodoDesde, setPeriodoDesde] = useState("");
  const [periodoHasta, setPeriodoHasta] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSueldo, setSelectedSueldo] = useState<EmpleadoSueldo | null>(null);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [sueldoVer, setSueldoVer] = useState<EmpleadoSueldo | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, isInitialized, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sueldosResponse, empleadosResponse] = await Promise.all([
        getEmpleadoSueldos(),
        getEmpleados(),
      ]);

      if (!sueldosResponse.ok) throw new Error(sueldosResponse.error || "Error al cargar sueldos");
      if (!empleadosResponse.ok) throw new Error(empleadosResponse.error || "Error al cargar empleados");

      setSueldos(sueldosResponse.data || []);
      setEmpleados(empleadosResponse.data || []);
    } catch (error) {
      setSueldos([]);
      setEmpleados([]);
      toast.error(error instanceof Error ? error.message : "Error al cargar sueldos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const filteredSueldos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return sueldos.filter((sueldo) => {
      const empleado = sueldo.empleado;
      const matchesEstado = estadoFilter === "todos" || sueldo.estado === estadoFilter;
      const matchesPeriodo = periodoInRange(sueldo.periodo, periodoDesde, periodoHasta);
      const searchable = [
        empleado?.nombre_completo,
        empleado?.dni,
        empleado?.email,
        sueldo.concepto,
        sueldo.estado,
        sueldo.medio_pago,
        sueldo.observaciones,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesEstado && matchesPeriodo && (!term || searchable.includes(term));
    });
  }, [sueldos, searchTerm, estadoFilter, periodoDesde, periodoHasta]);

  const totals = useMemo(() => {
    return filteredSueldos.reduce(
      (acc, sueldo) => {
        acc.total += 1;
        acc.neto += Number(sueldo.monto_neto ?? 0);
        if (sueldo.estado === "pendiente") acc.pendiente += Number(sueldo.monto_neto ?? 0);
        if (sueldo.estado === "pagado") acc.pagado += Number(sueldo.monto_neto ?? 0);
        if (sueldo.estado === "anulado") acc.anulados += 1;
        return acc;
      },
      { total: 0, neto: 0, pendiente: 0, pagado: 0, anulados: 0 }
    );
  }, [filteredSueldos]);

  const totalPages = Math.max(1, Math.ceil(filteredSueldos.length / PAGE_SIZE));
  const paginatedSueldos = filteredSueldos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, periodoDesde, periodoHasta]);

  const handleAnular = async (sueldo: EmpleadoSueldo) => {
    if (!confirm(`¿Anular el sueldo de ${sueldo.empleado?.nombre_completo ?? "este empleado"}?`)) return;

    const response = await anularEmpleadoSueldo(sueldo.id);

    if (!response.ok) {
      toast.error(response.error || "No se pudo anular el sueldo");
      return;
    }

    toast.success("Sueldo anulado");
    await loadData();
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(salaryExportTx(locale, "Sueldos empleados", "Employee salaries"));

    sheet.columns = [
      { header: salaryExportTx(locale, "Empleado", "Employee"), key: "empleado", width: 28 },
      { header: "DNI", key: "dni", width: 16 },
      { header: salaryExportTx(locale, "Periodo", "Period"), key: "periodo", width: 14 },
      { header: salaryExportTx(locale, "Concepto", "Concept"), key: "concepto", width: 24 },
      { header: salaryExportTx(locale, "Base", "Base"), key: "base", width: 14 },
      { header: salaryExportTx(locale, "Bonos", "Bonuses"), key: "bonos", width: 14 },
      { header: salaryExportTx(locale, "Descuentos", "Discounts"), key: "descuentos", width: 14 },
      { header: salaryExportTx(locale, "Neto", "Net"), key: "neto", width: 14 },
      { header: salaryExportTx(locale, "Estado", "Status"), key: "estado", width: 14 },
      { header: salaryExportTx(locale, "Medio de pago", "Payment method"), key: "medio", width: 18 },
      { header: salaryExportTx(locale, "Fecha de pago", "Payment date"), key: "fechaPago", width: 16 },
    ];

    filteredSueldos.forEach((sueldo) => {
      sheet.addRow({
        empleado: sueldo.empleado?.nombre_completo ?? "",
        dni: sueldo.empleado?.dni ?? "",
        periodo: formatFrontendDate(sueldo.periodo),
        concepto: salaryConceptLabel(locale, sueldo.concepto),
        base: Number(sueldo.sueldo_base ?? 0),
        bonos: Number(sueldo.bonos ?? 0),
        descuentos: Number(sueldo.descuentos ?? 0),
        neto: Number(sueldo.monto_neto ?? 0),
        estado: salaryStatusExportLabel(locale, sueldo.estado),
        medio: salaryPaymentMethodLabel(locale, sueldo.medio_pago),
        fechaPago: formatFrontendDate(sueldo.fecha_pago),
      });
    });

    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = buildTimestampedDownloadFileName(salaryExportTx(locale, "listado-sueldos-empleados", "employee-salaries-list"), "xlsx");
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadPdf = async () => {
    await downloadCommercialReportPdf({
      title: salaryExportTx(locale, "Sueldos de empleados", "Employee salaries"),
      subtitle: salaryExportTx(locale, "Liquidaciones, pagos y recibos del personal.", "Payroll settlements, payments, and staff receipts."),
      fileName: buildTimestampedDownloadFileName(salaryExportTx(locale, "listado-sueldos-empleados", "employee-salaries-list"), "pdf"),
      locale: locale === "en" ? "en" : "es",
      footerText: salaryExportTx(locale, "Documento generado por Gym Master.", "Document generated by Gym Master."),
      rows: filteredSueldos,
      metrics: [
        { label: salaryExportTx(locale, "Registros", "Records"), value: totals.total },
        { label: salaryExportTx(locale, "Total neto", "Total net"), value: formatCurrencyARS(totals.neto) },
        { label: salaryExportTx(locale, "Pagado", "Paid"), value: formatCurrencyARS(totals.pagado) },
        { label: salaryExportTx(locale, "Pendiente", "Pending"), value: formatCurrencyARS(totals.pendiente) },
      ],
      filtersLabel: `${salaryExportTx(locale, "Estado", "Status")}: ${estadoLabel(estadoFilter, locale)} · ${salaryExportTx(locale, "Desde", "From")}: ${periodoDesde || salaryExportTx(locale, "sin filtro", "no filter")} · ${salaryExportTx(locale, "Hasta", "To")}: ${periodoHasta || salaryExportTx(locale, "sin filtro", "no filter")} · ${salaryExportTx(locale, "Búsqueda", "Search")}: ${searchTerm || salaryExportTx(locale, "sin búsqueda", "no search")}`,
      columns: [
        { header: salaryExportTx(locale, "Empleado", "Employee"), width: 38, getValue: (row) => row.empleado?.nombre_completo ?? "-" },
        { header: salaryExportTx(locale, "Periodo", "Period"), width: 22, getValue: (row) => formatFrontendDate(row.periodo) },
        { header: salaryExportTx(locale, "Neto", "Net"), width: 24, getValue: (row) => formatCurrencyARS(row.monto_neto), align: "right" },
        { header: salaryExportTx(locale, "Estado", "Status"), width: 22, getValue: (row) => salaryStatusExportLabel(locale, row.estado) },
        { header: salaryExportTx(locale, "Pago", "Payment"), width: 24, getValue: (row) => formatFrontendDate(row.fecha_pago) },
        { header: salaryExportTx(locale, "Medio", "Method"), width: 28, getValue: (row) => salaryPaymentMethodLabel(locale, row.medio_pago) },
      ],
    });
  };

  const downloadReceiptPdf = async (sueldo: EmpleadoSueldo) => {
    await downloadCommercialReportPdf({
      title: salaryExportTx(locale, "Recibo de sueldo", "Salary receipt"),
      subtitle: salaryExportTx(locale, "Comprobante interno de liquidación de haberes del gimnasio.", "Internal payroll settlement receipt for the gym."),
      fileName: buildTimestampedDownloadFileName(salaryExportTx(locale, `recibo-sueldo-${sueldo.empleado?.dni ?? sueldo.id}`, `salary-receipt-${sueldo.empleado?.dni ?? sueldo.id}`), "pdf"),
      locale: locale === "en" ? "en" : "es",
      pageFormat: "a5",
      pageOrientation: "portrait",
      brandName: salaryExportTx(locale, "Gimnasio", "Gym"),
      brandSubtitle: salaryExportTx(locale, "Recibo emitido por el gimnasio contratante", "Receipt issued by the contracting gym"),
      footerText: salaryExportTx(locale, "Recibo emitido por el gimnasio contratante", "Receipt issued by the contracting gym"),
      rows: [sueldo],
      metrics: [
        { label: salaryExportTx(locale, "Sueldo base", "Base salary"), value: formatCurrencyARS(sueldo.sueldo_base) },
        { label: salaryExportTx(locale, "Bonos", "Bonuses"), value: formatCurrencyARS(sueldo.bonos) },
        { label: salaryExportTx(locale, "Descuentos", "Discounts"), value: formatCurrencyARS(sueldo.descuentos) },
        { label: salaryExportTx(locale, "Neto", "Net"), value: formatCurrencyARS(sueldo.monto_neto) },
      ],
      filtersLabel: `${salaryExportTx(locale, "Empleado", "Employee")}: ${sueldo.empleado?.nombre_completo ?? "-"} · DNI: ${sueldo.empleado?.dni ?? "-"} · ${salaryExportTx(locale, "Período", "Period")}: ${formatFrontendDate(sueldo.periodo)} · ${salaryExportTx(locale, "Estado", "Status")}: ${salaryStatusExportLabel(locale, sueldo.estado)}`,
      columns: [
        { header: salaryExportTx(locale, "Concepto", "Concept"), width: 50, getValue: (row) => salaryConceptLabel(locale, row.concepto) },
        { header: salaryExportTx(locale, "Base", "Base"), width: 26, getValue: (row) => formatCurrencyARS(row.sueldo_base), align: "right" },
        { header: salaryExportTx(locale, "Bonos", "Bonuses"), width: 26, getValue: (row) => formatCurrencyARS(row.bonos), align: "right" },
        { header: salaryExportTx(locale, "Desc.", "Disc."), width: 26, getValue: (row) => formatCurrencyARS(row.descuentos), align: "right" },
        { header: salaryExportTx(locale, "Neto", "Net"), width: 30, getValue: (row) => formatCurrencyARS(row.monto_neto), align: "right" },
      ],
    });
  };

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader title={salaryText("Sueldos", "Salaries")} />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{salaryText("Registros", "Records")}</p>
                <p className="text-2xl font-bold">{totals.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{salaryText("Total neto", "Total net")}</p>
                <p className="text-2xl font-bold">{formatCurrencyARS(totals.neto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{salaryText("Pagado", "Paid")}</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrencyARS(totals.pagado)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{salaryText("Pendiente", "Pending")}</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrencyARS(totals.pendiente)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-sky-50 p-2 text-sky-600">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">{salaryText("Sueldos de empleados", "Employee salaries")}</h1>
                  <p className="text-sm text-muted-foreground">
                    {salaryText("Registro opcional de liquidaciones, pagos y recibos del personal.", "Optional record of payroll settlements, payments and staff receipts.")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={downloadPdf}>
                  <FileText className="mr-2 h-4 w-4" />
                  {salaryText("Descargar PDF", "Download PDF")}
                </Button>
                <Button type="button" variant="outline" onClick={exportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {salaryText("Exportar", "Export")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedSueldo(null);
                    setOpenModal(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {salaryText("Nuevo sueldo", "New salary")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <select
                  aria-label={salaryText("Filtrar por estado", "Filter by status")}
                  value={estadoFilter}
                  onChange={(event) => setEstadoFilter(event.target.value as EstadoFilter)}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="todos">{salaryText("Todos los estados", "All statuses")}</option>
                  <option value="pendiente">{salaryText("Pendientes", "Pending")}</option>
                  <option value="pagado">{salaryText("Pagados", "Paid")}</option>
                  <option value="anulado">{salaryText("Anulados", "Canceled")}</option>
                </select>
                <MonthFilterInput
                  value={periodoDesde}
                  onChange={setPeriodoDesde}
                  isEnglish={isEnglish}
                  ariaLabel={salaryText("Período desde", "Period from")}
                  placeholder={salaryText("Desde período", "From period (YYYY-MM)")}
                />
                <MonthFilterInput
                  value={periodoHasta}
                  onChange={setPeriodoHasta}
                  isEnglish={isEnglish}
                  ariaLabel={salaryText("Período hasta", "Period to")}
                  placeholder={salaryText("Hasta período", "To period (YYYY-MM)")}
                />
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label={salaryText("Buscar sueldos de empleados", "Search employee salaries")}
                    placeholder={salaryText("Buscar empleado, DNI, concepto, medio...", "Search employee, ID, concept, payment method...")}
                    className="pl-9"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-muted-foreground">{salaryText("Cargando sueldos...", "Loading salaries...")}</div>
              ) : (
                <EmpleadoSueldoTable
                  sueldos={paginatedSueldos}
                  onView={(sueldo) => {
                    setSueldoVer(sueldo);
                    setOpenViewModal(true);
                  }}
                  onEdit={(sueldo) => {
                    setSelectedSueldo(sueldo);
                    setOpenModal(true);
                  }}
                  onAnular={handleAnular}
                  onReceipt={downloadReceiptPdf}
                />
              )}

              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredSueldos.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
              <p className="text-sm text-muted-foreground">
                {isEnglish
                  ? `Showing ${paginatedSueldos.length} of ${filteredSueldos.length} records.`
                  : `Mostrando ${paginatedSueldos.length} de ${filteredSueldos.length} registros.`}
              </p>
            </CardContent>
          </Card>
        </main>
        <AppFooter />
      </SidebarInset>

      <EmpleadoSueldoModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadData}
        sueldo={selectedSueldo}
        empleados={empleados}
      />
      <EmpleadoSueldoViewModal
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        sueldo={sueldoVer}
        onDownloadReceipt={downloadReceiptPdf}
      />
    </SidebarProvider>
  );
}
