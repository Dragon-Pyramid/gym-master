"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, FileSpreadsheet } from "lucide-react";
import { deletePagoApi, fetchPagosApi } from "@/services/browser/pagoApiClient";
import PagoModal from "@/components/modal/PagoModal";
import PagoViewModal from "@/components/modal/PagoViewModal";
import PagoTable from "@/components/tables/PagoTable";
import { ResponsePago } from "@/interfaces/pago.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import { descargarPagoReciboPdf } from "@/utils/pagoReciboPdf";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { useI18n } from "@/i18n/I18nProvider";

const PAGOS_PAGE_SIZE = 10;

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentExportTx(locale: string, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizePaymentExportText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\s/.,;:()"'¿?¡!+\-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const PAYMENT_EXPORT_TEXTS: Record<string, string> = {
  todos: "All",
  todas: "All",
  all: "All",
  efectivo: "Cash",
  cash: "Cash",
  stripe: "Stripe",
  transferencia: "Bank transfer",
  transferencia_bancaria: "Bank transfer",
  bank_transfer: "Bank transfer",
  tarjeta: "Card",
  tarjeta_de_debito: "Debit card",
  tarjeta_de_credito: "Credit card",
  debit_card: "Debit card",
  credit_card: "Credit card",
  otro: "Other",
  otros: "Other",
  other: "Other",
  manual: "Manual",
  pagado: "Paid",
  paid: "Paid",
  pendiente: "Pending",
  pending: "Pending",
  vencido: "Overdue",
  overdue: "Overdue",
  cancelado: "Cancelled",
  cancelled: "Cancelled",
  anulado: "Voided",
  voided: "Voided",
  rechazado: "Rejected",
  rejected: "Rejected",
  cuota: "Fee",
  cuotas: "Fees",
  cuota_mensual: "Monthly fee",
  cuota_mensual_qa_pagos: "Monthly QA payment fee",
  qa_demo_cuota: "QA demo fee",
  semana: "This week",
  esta_semana: "This week",
  mes: "This month",
  este_mes: "This month",
  hoy: "Today",
};

function translatePaymentExportText(locale: string, value?: string | null, fallback = "") {
  const original = String(value ?? fallback ?? "").trim();
  if (!original) return "";
  if (locale !== "en") return original;

  const normalized = normalizePaymentExportText(original);
  if (PAYMENT_EXPORT_TEXTS[normalized]) return PAYMENT_EXPORT_TEXTS[normalized];

  const replaced = original
    .replace(/efectivo/gi, "Cash")
    .replace(/transferencia/gi, "Bank transfer")
    .replace(/otro/gi, "Other")
    .replace(/pagado/gi, "Paid")
    .replace(/pendiente/gi, "Pending")
    .replace(/cancelado/gi, "Cancelled")
    .replace(/cuota mensual/gi, "Monthly fee")
    .replace(/cuota/gi, "Fee");

  return replaced;
}

function paymentMethodExportLabel(locale: string, value?: string | null) {
  return translatePaymentExportText(locale, value, paymentExportTx(locale, "Sin método", "No method")) || "-";
}

function paymentStatusExportLabel(locale: string, value?: string | null) {
  return translatePaymentExportText(locale, value, paymentExportTx(locale, "Sin estado", "No status")) || "-";
}

function paymentFeeExportLabel(locale: string, value?: string | null) {
  return translatePaymentExportText(locale, value) || "-";
}

function paymentPeriodFilterExportLabel(locale: string, value: string) {
  if (value === "todos") return paymentExportTx(locale, "todos", "All");
  return translatePaymentExportText(locale, value);
}

function formatPaymentMoney(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatPaymentDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-AR").format(parsed);
}


export default function PagosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = useCallback(
    (es: string, en: string) => (isEnglish ? en : es),
    [isEnglish],
  );
  const [pagos, setPagos] = useState<ResponsePago[]>([]);
  const [filteredPagos, setFilteredPagos] = useState<ResponsePago[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<ResponsePago | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [pagoVer, setPagoVer] = useState<ResponsePago | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadPagos = async () => {
    try {
      setLoading(true);
      const data = await fetchPagosApi();
      setPagos(data ?? []);
      setFilteredPagos(data ?? []);
    } catch (error: any) {
      toast.error(
        error.message || tx("Error al cargar pagos", "Error loading payments"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: tx("Listado de pagos", "Payments list"),
        subtitle: tx(
          "Reporte de pagos manuales, Stripe, períodos y estados.",
          "Report of manual payments, Stripe payments, covered periods, and statuses.",
        ),
        fileName: paymentExportTx(locale, "listado-pagos-gym-master", "gym-master-payments-list"),
        locale,
        footerText: paymentExportTx(
          locale,
          "Documento generado por Gym Master.",
          "Document generated by Gym Master.",
        ),
        labels: {
          generated: paymentExportTx(locale, "Generado", "Generated"),
          page: paymentExportTx(locale, "Página", "Page"),
          of: paymentExportTx(locale, "de", "of"),
          detail: paymentExportTx(locale, "Detalle", "Details"),
          records: paymentExportTx(locale, "registros", "records"),
          empty: paymentExportTx(
            locale,
            "No hay registros para el filtro seleccionado.",
            "No records found for the selected filter.",
          ),
        },
        rows: filteredPagos,
        metrics: [
          {
            label: tx("Pagos filtrados", "Filtered payments"),
            value: filteredPagos.length,
          },
          {
            label: tx("Total efectivo", "Cash total"),
            value: formatPaymentMoney(totalEfectivo, locale),
          },
        ],
        filtersLabel:
          tx("Período", "Period") +
          ": " +
          paymentPeriodFilterExportLabel(locale, periodFilter) +
          (fechaDesde ? " · " + tx("Desde", "From") + ": " + fechaDesde : "") +
          (fechaHasta ? " · " + tx("Hasta", "To") + ": " + fechaHasta : "") +
          (searchTerm.trim() ? " · " + tx("Búsqueda", "Search") + ": " + searchTerm.trim() : ""),
        columns: [
          {
            header: tx("Socio", "Member"),
            width: 42,
            getValue: (p) => p.socio?.nombre_completo || "-",
          },
          {
            header: tx("Cuota", "Fee"),
            width: 36,
            getValue: (p) => paymentFeeExportLabel(locale, p.cuota?.descripcion),
          },
          {
            header: tx("Fecha pago", "Payment date"),
            width: 24,
            getValue: (p) => formatPaymentDate(p.fecha_pago, locale),
          },
          {
            header: tx("Período", "Period"),
            width: 36,
            getValue: (p) =>
              `${formatPaymentDate(p.periodo_desde || p.fecha_pago, locale)} / ${formatPaymentDate(p.periodo_hasta || p.fecha_vencimiento, locale)}`,
          },
          {
            header: tx("Método", "Method"),
            width: 22,
            getValue: (p) => paymentMethodExportLabel(locale, p.metodo_pago),
          },
          {
            header: tx("Estado", "Status"),
            width: 22,
            getValue: (p) => paymentStatusExportLabel(locale, p.estado),
          },
          {
            header: tx("Monto", "Amount"),
            width: 24,
            getValue: (p) =>
              formatPaymentMoney(numberOrZero(p.monto_pagado), locale),
            align: "right",
          },
          {
            header: tx("Registrado por", "Registered by"),
            width: 34,
            getValue: (p) => p.registrado_por?.nombre || "-",
          },
        ],
      });
    } catch {
      toast.error(
        tx(
          "No se pudo generar el PDF de pagos",
          "Could not generate the payments PDF",
        ),
      );
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tx("Pagos", "Payments"));

    worksheet.columns = [
      { header: tx("Socio", "Member"), key: "socio", width: 28 },
      { header: tx("Cuota", "Fee"), key: "cuota", width: 28 },
      {
        header: tx("Fecha Pago", "Payment Date"),
        key: "fecha_pago",
        width: 16,
      },
      {
        header: tx("Periodo Desde", "Period From"),
        key: "periodo_desde",
        width: 16,
      },
      {
        header: tx("Periodo Hasta", "Period To"),
        key: "periodo_hasta",
        width: 16,
      },
      { header: tx("Meses", "Months"), key: "meses", width: 10 },
      { header: tx("Método", "Method"), key: "metodo", width: 16 },
      { header: tx("Estado", "Status"), key: "estado", width: 14 },
      { header: tx("Subtotal", "Subtotal"), key: "subtotal", width: 15 },
      {
        header: tx("Descuento %", "Discount %"),
        key: "descuento_porcentaje",
        width: 14,
      },
      {
        header: tx("Descuento Monto", "Discount Amount"),
        key: "descuento_monto",
        width: 18,
      },
      {
        header: tx("Monto Pagado", "Amount Paid"),
        key: "monto_pagado",
        width: 15,
      },
      {
        header: tx("Registrado Por", "Registered By"),
        key: "registrado_por",
        width: 20,
      },
    ];

    filteredPagos.forEach((p) => {
      worksheet.addRow({
        socio: p.socio?.nombre_completo || "",
        cuota: paymentFeeExportLabel(locale, p.cuota?.descripcion),
        fecha_pago: p.fecha_pago,
        periodo_desde: p.periodo_desde || p.fecha_pago,
        periodo_hasta: p.periodo_hasta || p.fecha_vencimiento,
        meses: p.meses_cubiertos || 1,
        metodo: paymentMethodExportLabel(locale, p.metodo_pago),
        estado: paymentStatusExportLabel(locale, p.estado),
        subtotal: p.subtotal ?? p.monto_pagado,
        descuento_porcentaje: p.descuento_porcentaje ?? 0,
        descuento_monto: p.descuento_monto ?? 0,
        monto_pagado: p.monto_pagado,
        registrado_por: p.registrado_por?.nombre || "",
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName(
      paymentExportTx(locale, "listado-pagos", "payments-list"),
      "xlsx",
    );
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const handleDownloadReceipt = async (pago: ResponsePago) => {
    try {
      await descargarPagoReciboPdf(pago);
      toast.success(
        tx(
          "Recibo PDF generado correctamente",
          "PDF receipt generated successfully",
        ),
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
          tx(
            "Error al generar el recibo PDF",
            "Error generating the PDF receipt",
          ),
      );
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadPagos();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    const lowercaseSearch = searchTerm.toLowerCase().trim();
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const startOfWeekDate = new Date(today);
    startOfWeekDate.setDate(today.getDate() - 6);
    const startOfWeek = startOfWeekDate.toISOString().slice(0, 10);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const startOfYear = new Date(today.getFullYear(), 0, 1)
      .toISOString()
      .slice(0, 10);

    const filtered = pagos.filter((p) => {
      const fecha = p.fecha_pago || "";
      const matchesSearch =
        lowercaseSearch === "" ||
        (p.socio?.nombre_completo || "")
          .toLowerCase()
          .includes(lowercaseSearch) ||
        (p.cuota?.descripcion || "").toLowerCase().includes(lowercaseSearch) ||
        (p.registrado_por?.nombre || "")
          .toLowerCase()
          .includes(lowercaseSearch) ||
        (p.metodo_pago || "").toLowerCase().includes(lowercaseSearch) ||
        (p.estado || "").toLowerCase().includes(lowercaseSearch);

      if (!matchesSearch) return false;
      if (fechaDesde && fecha < fechaDesde) return false;
      if (fechaHasta && fecha > fechaHasta) return false;
      if (periodFilter === "dia" && fecha !== todayIso) return false;
      if (periodFilter === "semana" && fecha < startOfWeek) return false;
      if (periodFilter === "mes" && fecha < startOfMonth) return false;
      if (periodFilter === "anio" && fecha < startOfYear) return false;

      return true;
    });

    setFilteredPagos(filtered);
  }, [searchTerm, pagos, periodFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, periodFilter, fechaDesde, fechaHasta]);

  const totalPagos = filteredPagos.length;
  const totalPages = Math.max(1, Math.ceil(totalPagos / PAGOS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPagos = filteredPagos.slice(
    (safeCurrentPage - 1) * PAGOS_PAGE_SIZE,
    safeCurrentPage * PAGOS_PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalEfectivo = filteredPagos
    .filter((p) => p.metodo_pago === "efectivo" && p.estado !== "cancelado")
    .reduce((acc, pago) => acc + numberOrZero(pago.monto_pagado), 0);

  if (!isInitialized) {
    return <div>{tx("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx("Pagos", "Payments")} />
          <main className="flex-1 p-6 space-y-6 dark:bg-black">
            <Card className="w-full dark:border-neutral-800 dark:bg-neutral-950/80">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <div>
                  <h2 className="text-xl font-bold">
                    {tx("Listado de pagos", "Payments list")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {tx("Total efectivo filtrado", "Filtered cash total")}: {formatPaymentMoney(totalEfectivo, locale)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={tx(
                        "Buscar por socio, cuota, método...",
                        "Search by member, fee, method...",
                      )}
                      className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="todos">
                      {tx("Todos los períodos", "All periods")}
                    </option>
                    <option value="dia">{tx("Hoy", "Today")}</option>
                    <option value="semana">
                      {tx("Últimos 7 días", "Last 7 days")}
                    </option>
                    <option value="mes">
                      {tx("Mes actual", "Current month")}
                    </option>
                    <option value="anio">
                      {tx("Año actual", "Current year")}
                    </option>
                  </select>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-[150px]"
                    title={tx("Fecha desde", "Date from")}
                  />
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-[150px]"
                    title={tx("Fecha hasta", "Date to")}
                  />
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-neutral-950 dark:text-cyan-300 dark:border-cyan-800 dark:hover:bg-neutral-900"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {tx("Descargar PDF", "Download PDF")}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-neutral-950 dark:text-cyan-300 dark:border-cyan-800 dark:hover:bg-neutral-900"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {tx("Exportar", "Export")}
                    </span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">
                      {tx("Registrar pago manual", "Register manual payment")}
                    </span>
                    <span className="sm:hidden">{tx("Añadir", "Add")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <PagoTable
                    pagos={paginatedPagos}
                    loading={loading}
                    onEdit={(pago) => {
                      setSelectedPago(pago);
                      setOpenModal(true);
                    }}
                    onView={(pago) => {
                      setPagoVer(pago);
                      setOpenModalVer(true);
                    }}
                    onReceipt={handleDownloadReceipt}
                    onDelete={async (pago) => {
                      const confirmar = window.confirm(
                        tx(
                          "¿Está seguro de eliminar el pago?",
                          "Are you sure you want to delete this payment?",
                        ),
                      );
                      if (!confirmar) return;

                      try {
                        await deletePagoApi(pago.id);
                        toast.success(
                          tx(
                            "Pago eliminado correctamente",
                            "Payment deleted successfully",
                          ),
                        );
                        await loadPagos();
                      } catch (err: any) {
                        toast.error(
                          err.message ||
                            tx(
                              "Error al eliminar pago",
                              "Error deleting payment",
                            ),
                        );
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalPagos}
                  pageSize={PAGOS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel={tx("pagos", "payments")}
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <PagoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedPago(null);
        }}
        onCreated={loadPagos}
        pago={selectedPago}
      />

      <PagoViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setPagoVer(null);
        }}
        pago={pagoVer}
        onReceiptDownload={handleDownloadReceipt}
      />
    </SidebarProvider>
  );
}
