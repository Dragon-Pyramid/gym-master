"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Plus, ReceiptText, Search } from "lucide-react";
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

const PAGE_SIZE = 10;
type EstadoFilter = "todos" | OtrosGastosEstado;

function estadoLabel(estado: EstadoFilter) {
  if (estado === "todos") return "Todos";
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

function getTipoNombre(gasto: OtrosGastos) {
  return gasto.tipo_gasto?.nombre ?? "Sin clasificar";
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
        getTipoNombre(gasto),
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
  }, [estadoFilter, fechaDesde, fechaHasta, gastos, searchTerm]);

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
    `Estado: ${estadoLabel(estadoFilter)}`,
    fechaDesde ? `Desde: ${formatFrontendDate(fechaDesde)}` : null,
    fechaHasta ? `Hasta: ${formatFrontendDate(fechaHasta)}` : null,
    searchTerm ? `Búsqueda: ${searchTerm}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Gastos");

    worksheet.columns = [
      { header: "Descripción", key: "descripcion", width: 38 },
      { header: "Tipo", key: "tipo", width: 22 },
      { header: "Entidad", key: "entidad", width: 24 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Medio de pago", key: "medio_pago", width: 18 },
      { header: "Monto", key: "monto", width: 16 },
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Vencimiento", key: "fecha_vencimiento", width: 14 },
      { header: "Fecha pago", key: "fecha_pago", width: 14 },
      { header: "Período desde", key: "periodo_desde", width: 14 },
      { header: "Período hasta", key: "periodo_hasta", width: 14 },
      { header: "Comprobante", key: "comprobante", width: 35 },
      { header: "Observaciones", key: "observaciones", width: 35 },
    ];

    filteredGastos.forEach((g) => {
      worksheet.addRow({
        descripcion: g.descripcion,
        tipo: getTipoNombre(g),
        entidad: g.proveedor_nombre || g.entidad || "-",
        estado: g.estado ?? "-",
        medio_pago: g.medio_pago?.replace(/_/g, " ") ?? "-",
        monto: Number(g.monto ?? 0),
        fecha: formatFrontendDate(g.fecha),
        fecha_vencimiento: g.fecha_vencimiento ? formatFrontendDate(g.fecha_vencimiento) : "-",
        fecha_pago: g.fecha_pago ? formatFrontendDate(g.fecha_pago) : "-",
        periodo_desde: g.periodo_desde ? formatFrontendDate(g.periodo_desde) : "-",
        periodo_hasta: g.periodo_hasta ? formatFrontendDate(g.periodo_hasta) : "-",
        comprobante: g.comprobante_url ?? "-",
        observaciones: g.observaciones ?? "-",
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
      title: "Listado de Gastos / Egresos",
      subtitle: "Control operativo de egresos del gimnasio",
      fileName: "listado-gastos-egresos",
      rows: filteredGastos,
      filtersLabel,
      metrics: [
        { label: "Total", value: metrics.total },
        { label: "Activos", value: metrics.activos },
        { label: "Pendientes", value: metrics.pendientes },
        { label: "Vencidos", value: metrics.vencidos },
        { label: "Con comprobante", value: metrics.conComprobante },
      ],
      columns: [
        { header: "Descripción", width: 34, getValue: (g) => g.descripcion },
        { header: "Tipo", width: 22, getValue: (g) => getTipoNombre(g) },
        { header: "Entidad", width: 24, getValue: (g) => g.proveedor_nombre || g.entidad || "-" },
        { header: "Estado", width: 16, getValue: (g) => g.estado ?? "-" },
        { header: "Medio", width: 18, getValue: (g) => g.medio_pago?.replace(/_/g, " ") ?? "-" },
        { header: "Monto", width: 20, align: "right", getValue: (g) => formatCurrencyARS(Number(g.monto ?? 0)) },
        { header: "Fecha", width: 16, getValue: (g) => formatFrontendDate(g.fecha) },
        { header: "Venc.", width: 16, getValue: (g) => g.fecha_vencimiento ? formatFrontendDate(g.fecha_vencimiento) : "-" },
        { header: "Comp.", width: 18, getValue: (g) => g.numero_comprobante ?? "-" },
      ],
    });
  };

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Gastos / Egresos" />
          <main className="flex-1 space-y-6 p-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total egresos</p>
                  <p className="text-2xl font-bold">{metrics.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold">{metrics.activos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{metrics.pendientes}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.vencidos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Comprobantes</p>
                  <p className="text-2xl font-bold text-sky-600">{metrics.conComprobante}</p>
                </CardContent>
              </Card>
            </section>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                <div>
                  <h2 className="text-xl font-bold">Listado de Gastos / Egresos</h2>
                  <p className="text-sm text-muted-foreground">
                    Registrá gastos operativos, vencimientos, medios de pago y comprobantes.
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <select
                    value={estadoFilter}
                    onChange={(event) => setEstadoFilter(event.target.value as EstadoFilter)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="pagado">Pagados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="vencido">Vencidos</option>
                    <option value="anulado">Anulados</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      aria-label="Fecha desde"
                      title="Fecha desde"
                      value={fechaDesde}
                      onChange={(event) => setFechaDesde(event.target.value)}
                      className="w-[150px]"
                    />
                    <Input
                      type="date"
                      aria-label="Fecha hasta"
                      title="Fecha hasta"
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
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar gasto, tipo, entidad, comprobante..."
                      className="w-full pl-8 sm:w-[320px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Descargar PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 border-[#02a8e1] bg-white text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button onClick={() => setOpenModal(true)} className="bg-[#02a8e1] hover:bg-[#0288b1]">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Añadir Gasto</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="rounded-xl border bg-sky-50/60 p-4 text-sm text-sky-900">
                  <div className="flex items-start gap-2">
                    <ReceiptText className="mt-0.5 h-4 w-4" />
                    <p>
                      Los comprobantes pueden guardarse como URL o subirse a Cloudinary en formato PDF o imagen.
                      Los gastos anulados quedan fuera del total operativo.
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
                      const confirmar = window.confirm("¿Está seguro de anular el gasto?");
                      if (!confirmar) return;

                      try {
                        await deleteOtrosGastos(gasto.id);
                        toast.success("Gasto anulado correctamente");
                        await loadGastos();
                      } catch (err: any) {
                        toast.error(err?.message || "Error al anular gasto");
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={currentPage}
                  totalItems={filteredGastos.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="gastos"
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
