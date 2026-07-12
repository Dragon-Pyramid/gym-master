"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock3, DollarSign, FileSpreadsheet, FileText, Plus, ReceiptText, Search } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/PaginationControls";
import {
  getAllOtrosGastos,
  deleteOtrosGastos,
} from "@/services/otrosGastosService";
import OtrosGastosModal from "@/components/modal/OtrosGastosModal";
import OtrosGastosViewModal from "@/components/modal/OtrosGastosViewModal";
import OtrosGastosTable from "@/components/tables/OtrosGastosTable";
import { OtrosGastos, OtrosGastosEstado } from "@/interfaces/otros_gastos.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { formatFrontendDate } from "@/utils/dateFormat";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";
import {
  getOtrosGastosEstadoLabel,
  getOtrosGastosMedioPagoLabel,
  getOtrosGastosTipoLabel,
  translateOtrosGastosDescription,
  translateOtrosGastosUi,
 } from "@/utils/otrosGastosI18n";

const PAGE_SIZE = 10;
type EstadoFilter = "todos" | OtrosGastosEstado;

function estadoLabel(estado: EstadoFilter, locale: GymMasterLocale) {
  if (estado === "todos") return translateOtrosGastosUi(locale, "Todos");
  return getOtrosGastosEstadoLabel(locale, estado);
}

function getTipoNombre(gasto: OtrosGastos, locale: GymMasterLocale) {
  return getOtrosGastosTipoLabel(locale, gasto.tipo_gasto?.nombre);
}

function getDateOnlyTime(value?: string | null) {
  if (!value) return null;

  const raw = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;

  const time = new Date(`${raw}T00:00:00`).getTime();
  return Number.isNaN(time) ? null : time;
}

export default function OtrosGastosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const { locale } = useI18n();
  const c = (text: string) => translateOtrosGastosUi(locale, text);
  const router = useRouter();
  const [gastos, setGastos] = useState<OtrosGastos[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<OtrosGastos | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [gastoVer, setGastoVer] = useState<OtrosGastos | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadGastos = async () => {
    setLoading(true);
    try {
      const data = await getAllOtrosGastos();
      setGastos(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadGastos();
    }
  }, [isInitialized, isAuthenticated]);

  const filteredGastos = useMemo(() => {
    const lowercaseSearch = searchTerm.trim().toLowerCase();
    const desdeTime = getDateOnlyTime(fechaDesde);
    const hastaTime = getDateOnlyTime(fechaHasta);

    return gastos.filter((gasto) => {
      const matchesEstado = estadoFilter === "todos" || gasto.estado === estadoFilter;
      const gastoTime = getDateOnlyTime(gasto.fecha);
      const matchesFechaDesde = !desdeTime || (gastoTime !== null && gastoTime >= desdeTime);
      const matchesFechaHasta = !hastaTime || (gastoTime !== null && gastoTime <= hastaTime);
      const searchable = [
        gasto.descripcion,
        getTipoNombre(gasto, locale),
        gasto.proveedor_nombre,
        gasto.entidad,
        gasto.numero_comprobante,
        gasto.medio_pago,
        gasto.estado,
        gasto.fecha,
        gasto.fecha_vencimiento,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesEstado &&
        matchesFechaDesde &&
        matchesFechaHasta &&
        (!lowercaseSearch || searchable.includes(lowercaseSearch))
      );
    });
  }, [estadoFilter, fechaDesde, fechaHasta, gastos, locale, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, fechaDesde, fechaHasta]);

  const paginatedGastos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredGastos.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredGastos]);

  const metrics = useMemo(() => {
    const activos = gastos.filter((gasto) => gasto.activo !== false && gasto.estado !== "anulado");
    const total = activos.reduce((acc, gasto) => acc + Number(gasto.monto ?? 0), 0);
    const pendientes = activos.filter((gasto) => gasto.estado === "pendiente");
    const vencidos = activos.filter((gasto) => gasto.estado === "vencido");
    const conComprobante = activos.filter((gasto) => Boolean(gasto.comprobante_url));

    return {
      total: formatCurrencyARS(total),
      activos: activos.length,
      pendientes: pendientes.length,
      vencidos: vencidos.length,
      conComprobante: conComprobante.length,
    };
  }, [gastos]);

  const filtersLabel = [
    `${c("Estado:")} ${estadoLabel(estadoFilter, locale)}`,
    fechaDesde ? `${c("Desde:")} ${formatFrontendDate(fechaDesde)}` : null,
    fechaHasta ? `${c("Hasta:")} ${formatFrontendDate(fechaHasta)}` : null,
    searchTerm ? `${c("Búsqueda:")} ${searchTerm}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(c("Gastos / Egresos"));

    worksheet.columns = [
      { header: c("Descripción"), key: "descripcion", width: 38 },
      { header: c("Tipo"), key: "tipo", width: 22 },
      { header: c("Entidad"), key: "entidad", width: 24 },
      { header: c("Estado"), key: "estado", width: 14 },
      { header: c("Medio de pago"), key: "medio_pago", width: 18 },
      { header: c("Monto"), key: "monto", width: 16 },
      { header: c("Fecha"), key: "fecha", width: 14 },
      { header: c("Vencimiento"), key: "fecha_vencimiento", width: 14 },
      { header: c("Fecha pago"), key: "fecha_pago", width: 14 },
      { header: c("Período desde"), key: "periodo_desde", width: 14 },
      { header: c("Período hasta"), key: "periodo_hasta", width: 14 },
      { header: c("Comprobante"), key: "comprobante", width: 35 },
      { header: c("Observaciones"), key: "observaciones", width: 35 },
    ];

    filteredGastos.forEach((g) => {
      worksheet.addRow({
        descripcion: translateOtrosGastosDescription(locale, g.descripcion),
        tipo: getTipoNombre(g, locale),
        entidad: g.proveedor_nombre || g.entidad || "-",
        estado: getOtrosGastosEstadoLabel(locale, g.estado),
        medio_pago: getOtrosGastosMedioPagoLabel(locale, g.medio_pago),
        monto: Number(g.monto ?? 0),
        fecha: formatFrontendDate(g.fecha),
        fecha_vencimiento: g.fecha_vencimiento ? formatFrontendDate(g.fecha_vencimiento) : "-",
        fecha_pago: g.fecha_pago ? formatFrontendDate(g.fecha_pago) : "-",
        periodo_desde: g.periodo_desde ? formatFrontendDate(g.periodo_desde) : "-",
        periodo_hasta: g.periodo_hasta ? formatFrontendDate(g.periodo_hasta) : "-",
        comprobante: g.comprobante_url ?? "-",
        observaciones: translateOtrosGastosDescription(locale, g.observaciones),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName("listado-gastos-egresos", "xlsx");
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    await downloadCommercialReportPdf<OtrosGastos>({
      title: c("Listado de Gastos / Egresos"),
      subtitle: c("Control operativo de egresos del gimnasio"),
      fileName: "listado-gastos-egresos",
      rows: filteredGastos,
      filtersLabel,
      metrics: [
        { label: c("Total"), value: metrics.total },
        { label: c("Activos"), value: metrics.activos },
        { label: c("Pendientes"), value: metrics.pendientes },
        { label: c("Vencidos"), value: metrics.vencidos },
        { label: c("Con comprobante"), value: metrics.conComprobante },
      ],
      columns: [
        { header: c("Descripción"), width: 34, getValue: (g) => translateOtrosGastosDescription(locale, g.descripcion) },
        { header: c("Tipo"), width: 22, getValue: (g) => getTipoNombre(g, locale) },
        { header: c("Entidad"), width: 24, getValue: (g) => translateOtrosGastosDescription(locale, g.proveedor_nombre || g.entidad || "-") },
        { header: c("Estado"), width: 16, getValue: (g) => getOtrosGastosEstadoLabel(locale, g.estado) },
        { header: c("Medio"), width: 18, getValue: (g) => getOtrosGastosMedioPagoLabel(locale, g.medio_pago) },
        { header: c("Monto"), width: 20, align: "right", getValue: (g) => formatCurrencyARS(Number(g.monto ?? 0)) },
        { header: c("Fecha"), width: 16, getValue: (g) => formatFrontendDate(g.fecha) },
        { header: c("Vencimiento"), width: 16, getValue: (g) => g.fecha_vencimiento ? formatFrontendDate(g.fecha_vencimiento) : "-" },
        { header: c("Comp."), width: 18, getValue: (g) => g.numero_comprobante ?? "-" },
      ],
    });
  };

  if (!isInitialized) {
    return <div>{c("Cargando...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c("Gastos / Egresos")} />
          <main className="flex-1 space-y-6 p-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <Card className="border-emerald-100 bg-white dark:border-emerald-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-neutral-400">{c("Total egresos")}</p>
                      <p className="text-2xl font-bold text-foreground dark:text-white">{metrics.total}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <DollarSign className="h-5 w-5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-sky-100 bg-white dark:border-sky-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-neutral-400">{c("Activos")}</p>
                      <p className="text-2xl font-bold text-foreground dark:text-white">{metrics.activos}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-100 bg-white dark:border-amber-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-neutral-400">{c("Pendientes")}</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">{metrics.pendientes}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
                      <Clock3 className="h-5 w-5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-100 bg-white dark:border-red-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-neutral-400">{c("Vencidos")}</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-300">{metrics.vencidos}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-cyan-100 bg-white dark:border-cyan-900/60 dark:bg-neutral-950/80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-neutral-400">{c("Comprobantes")}</p>
                      <p className="text-2xl font-bold text-sky-600 dark:text-cyan-300">{metrics.conComprobante}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-300">
                      <ReceiptText className="h-5 w-5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="w-full dark:border-neutral-800 dark:bg-neutral-950/80">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                <div>
                  <h2 className="text-xl font-bold">{c("Listado de Gastos / Egresos")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {c("Registrá gastos operativos, vencimientos, medios de pago y comprobantes.")}
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <select
                    value={estadoFilter}
                    onChange={(event) => setEstadoFilter(event.target.value as EstadoFilter)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="todos">{c("Todos")}</option>
                    <option value="pagado">{c("Pagados")}</option>
                    <option value="pendiente">{c("Pendientes")}</option>
                    <option value="vencido">{c("Vencidos")}</option>
                    <option value="anulado">{c("Anulados")}</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      aria-label={c("Fecha desde")}
                      title={c("Fecha desde")}
                      value={fechaDesde}
                      onChange={(event) => setFechaDesde(event.target.value)}
                      className="w-[150px]"
                    />
                    <Input
                      type="date"
                      aria-label={c("Fecha hasta")}
                      title={c("Fecha hasta")}
                      value={fechaHasta}
                      onChange={(event) => setFechaHasta(event.target.value)}
                      className="w-[150px]"
                    />
                    {(fechaDesde || fechaHasta) && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setFechaDesde("");
                          setFechaHasta("");
                        }}
                        className="h-10 px-2 text-xs"
                      >
                        {c("Limpiar")}
                      </Button>
                    )}
                  </div>
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={c("Buscar gasto, tipo, entidad, comprobante...")}
                      className="w-full pl-8 sm:w-[320px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-neutral-950 dark:hover:bg-neutral-900"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">{c("Descargar PDF")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd] dark:bg-neutral-950 dark:hover:bg-neutral-900"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="hidden sm:inline">{c("Exportar")}</span>
                  </Button>
                  <Button onClick={() => setOpenModal(true)} className="bg-[#02a8e1] hover:bg-[#0288b1]">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{c("Añadir Gasto")}</span>
                    <span className="sm:hidden">{c("Añadir")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="rounded-xl border bg-sky-50/60 p-4 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                  <div className="flex items-start gap-2">
                    <ReceiptText className="mt-0.5 h-4 w-4" />
                    <p>
                      {c("Los comprobantes pueden guardarse como URL o subirse a Cloudinary en formato PDF o imagen. Los gastos anulados quedan fuera del total operativo.")}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <OtrosGastosTable
                    gastos={paginatedGastos}
                    loading={loading}
                    onView={(gasto) => {
                      setGastoVer(gasto);
                      setOpenModalVer(true);
                    }}
                    onEdit={(gasto) => {
                      setSelectedGasto(gasto);
                      setOpenModal(true);
                    }}
                    onDelete={async (gasto) => {
                      const confirmar = window.confirm(c("¿Está seguro de anular el gasto?"));
                      if (!confirmar) return;

                      try {
                        await deleteOtrosGastos(gasto.id);
                        toast.success(c("Gasto anulado correctamente"));
                        await loadGastos();
                      } catch (err: any) {
                        toast.error(err?.message || c("Error al anular gasto"));
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={currentPage}
                  totalItems={filteredGastos.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel={c("gastos")}
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <OtrosGastosModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedGasto(null);
        }}
        onCreated={loadGastos}
        gasto={selectedGasto}
      />

      <OtrosGastosViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setGastoVer(null);
        }}
        gasto={gastoVer}
      />
    </SidebarProvider>
  );
}
