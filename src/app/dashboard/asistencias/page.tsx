"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  FileSpreadsheet,
  MonitorUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  getAllAsistencias,
  deleteAsistencia,
} from "@/services/asistenciaService";
import AsistenciaModal from "@/components/modal/AsistenciaModal";
import AsistenciaViewModal from "@/components/modal/AsistenciaViewModal";
import AsistenciaTable from "@/components/tables/AsistenciaTable";
import { Asistencia } from "@/interfaces/asistencia.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { formatFrontendTime } from "@/utils/dateFormat";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { JwtUser } from "@/interfaces/jwtUser.interface";
import { AforoAsistenciaResumen } from "@/interfaces/asistenciaAforo.interface";
import {
  fetchAforoAsistencia,
  registrarSalidaAdministrativa,
} from "@/services/asistenciaAforoService";

const ASISTENCIAS_PAGE_SIZE = 10;
const ASISTENCIAS_AUTO_REFRESH_MS = 5000;

function getAsistenciaSortValue(asistencia: Asistencia) {
  const fecha = asistencia.fecha || "";
  const hora = asistencia.hora_ingreso || "00:00:00";
  return `${fecha}T${hora}`;
}

function sortAsistenciasByIngresoDesc(asistencias: Asistencia[]) {
  return [...asistencias].sort((a, b) =>
    getAsistenciaSortValue(b).localeCompare(getAsistenciaSortValue(a)),
  );
}

export default function AsistenciasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [filteredAsistencias, setFilteredAsistencias] = useState<Asistencia[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAsistencia, setSelectedAsistencia] =
    useState<Asistencia | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [asistenciaVer, setAsistenciaVer] = useState<Asistencia | null>(null);
  const [aforo, setAforo] = useState<AforoAsistenciaResumen | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadAforo = useCallback(async () => {
    try {
      const data = await fetchAforoAsistencia();
      setAforo(data);
    } catch (error: unknown) {
      console.warn("No se pudo cargar el aforo actual", error);
    }
  }, []);

  const loadAsistencias = useCallback(
    async (options?: { silent?: boolean; resetPage?: boolean }) => {
      const silent = options?.silent ?? false;
      const resetPage = options?.resetPage ?? true;

      try {
        if (silent) {
          setIsAutoRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getAllAsistencias(user as JwtUser);
        const orderedData = sortAsistenciasByIngresoDesc(data ?? []);
        setAsistencias(orderedData);

        if (resetPage) {
          setCurrentPage(1);
        }

        setLastUpdatedAt(new Date());
        await loadAforo();
      } finally {
        if (silent) {
          setIsAutoRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [user, loadAforo],
  );

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: "Listado de Asistencias",
        subtitle: "Reporte de ingresos, egresos y filtros de asistencia.",
        fileName: "listado-asistencias-gym-master",
        rows: filteredAsistencias,
        metrics: [
          { label: "Asistencias filtradas", value: filteredAsistencias.length },
        ],
        filtersLabel: `Período: ${periodFilter}${fechaDesde ? ` · Desde: ${fechaDesde}` : ""}${fechaHasta ? ` · Hasta: ${fechaHasta}` : ""}${searchTerm.trim() ? ` · Búsqueda: ${searchTerm.trim()}` : ""}`,
        columns: [
          {
            header: "Socio",
            width: 48,
            getValue: (a) => a.socio?.nombre_completo || a.socio_id,
          },
          { header: "Fecha", width: 26, getValue: (a) => a.fecha },
          {
            header: "Hora ingreso",
            width: 28,
            getValue: (a) => a.hora_ingreso || "-",
          },
          {
            header: "Hora egreso",
            width: 28,
            getValue: (a) => a.hora_egreso || "-",
          },
          { header: "ID socio", width: 56, getValue: (a) => a.socio_id },
        ],
      });
    } catch {
      toast.error("No se pudo generar el PDF de asistencias");
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Asistencias");

    worksheet.columns = [
      { header: "ID Asistencia", key: "id", width: 20 },
      { header: "ID Socio", key: "socio_id", width: 20 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Hora Ingreso", key: "hora_ingreso", width: 15 },
      { header: "Hora Egreso", key: "hora_egreso", width: 15 },
    ];

    filteredAsistencias.forEach((a) => {
      worksheet.addRow({
        id: a.id,
        socio_id: a.socio_id,
        fecha: a.fecha,
        hora_ingreso: a.hora_ingreso,
        hora_egreso: a.hora_egreso,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName(
      "listado-asistencias",
      "xlsx",
    );
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteAsistencia = async (asistencia: Asistencia) => {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar la asistencia del socio ${asistencia.socio_id} en la fecha ${asistencia.fecha}?`,
    );
    if (!confirmar) return;

    try {
      await deleteAsistencia(user as JwtUser, asistencia.id);
      toast.success("Asistencia eliminada correctamente");
      await loadAsistencias();
    } catch (error: unknown) {
      toast.error("Error al eliminar asistencia");
    }
  };

  const handleRegisterExit = async (asistencia: Asistencia) => {
    const socioNombre =
      asistencia.socio?.nombre_completo || asistencia.socio_id;
    const confirmar = window.confirm(`¿Registrar salida para ${socioNombre}?`);
    if (!confirmar) return;

    try {
      const response = await registrarSalidaAdministrativa(asistencia.id);
      toast.success(response.message || "Salida registrada correctamente");
      await loadAsistencias({ silent: true, resetPage: false });
    } catch (error: unknown) {
      toast.error((error as Error).message || "No se pudo registrar la salida");
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      void loadAsistencias();
    }
  }, [isInitialized, isAuthenticated, loadAsistencias]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadAsistencias({ silent: true, resetPage: false });
      }
    }, ASISTENCIAS_AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [isInitialized, isAuthenticated, loadAsistencias]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const today = new Date();
    const startOfToday = today.toISOString().slice(0, 10);
    const startOfWeekDate = new Date(today);
    startOfWeekDate.setDate(today.getDate() - 6);
    const startOfWeek = startOfWeekDate.toISOString().slice(0, 10);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const startOfYear = new Date(today.getFullYear(), 0, 1)
      .toISOString()
      .slice(0, 10);

    const filtered = asistencias.filter((a) => {
      const socioNombre =
        "socio" in a && a.socio?.nombre_completo ? a.socio.nombre_completo : "";
      const fecha = a.fecha || "";

      const matchesSearch =
        normalizedSearch === "" ||
        a.socio_id.toLowerCase().includes(normalizedSearch) ||
        fecha.toLowerCase().includes(normalizedSearch) ||
        (a.hora_ingreso ?? "").toLowerCase().includes(normalizedSearch) ||
        socioNombre.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;

      if (fechaDesde && fecha < fechaDesde) return false;
      if (fechaHasta && fecha > fechaHasta) return false;
      if (periodFilter === "dia" && fecha !== startOfToday) return false;
      if (periodFilter === "semana" && fecha < startOfWeek) return false;
      if (periodFilter === "mes" && fecha < startOfMonth) return false;
      if (periodFilter === "anio" && fecha < startOfYear) return false;

      return true;
    });

    setFilteredAsistencias(sortAsistenciasByIngresoDesc(filtered));
  }, [searchTerm, asistencias, periodFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, periodFilter, fechaDesde, fechaHasta]);

  const totalAsistencias = filteredAsistencias.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalAsistencias / ASISTENCIAS_PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAsistencias = filteredAsistencias.slice(
    (safeCurrentPage - 1) * ASISTENCIAS_PAGE_SIZE,
    safeCurrentPage * ASISTENCIAS_PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Asistencias" />
          <main className="flex-1 p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-emerald-100 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Dentro ahora
                      </p>
                      <p className="text-3xl font-black">
                        {aforo?.aforo_actual ?? "--"}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Capacidad configurada
                  </p>
                  <p className="text-3xl font-black">
                    {aforo?.capacidad_maxima ?? "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Variable GYM_MASTER_AFORO_MAXIMO
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ocupación
                  </p>
                  <p className="text-3xl font-black">
                    {aforo ? `${aforo.porcentaje_ocupacion}%` : "--"}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#02a8e1]"
                      style={{
                        width: `${Math.min(aforo?.porcentaje_ocupacion ?? 0, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card
                className={
                  aforo?.estado === "critico" || aforo?.estado === "alto"
                    ? "border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20"
                    : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Estado
                    </p>
                  </div>
                  <p className="mt-1 text-xl font-black capitalize">
                    {aforo?.estado ?? "--"}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {aforo?.mensaje_estado ?? "Sin datos de aforo."}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Asistencias</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar..."
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
                    <option value="todos">Todos los períodos</option>
                    <option value="dia">Hoy</option>
                    <option value="semana">Últimos 7 días</option>
                    <option value="mes">Mes actual</option>
                    <option value="anio">Año actual</option>
                  </select>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-[150px]"
                    title="Fecha desde"
                  />
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-[150px]"
                    title="Fecha hasta"
                  />
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Descargar PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/asistencias/aforo")}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Salida / Aforo</span>
                    <span className="sm:hidden">Aforo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        "/dashboard/asistencias/terminal",
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <MonitorUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Modo terminal</span>
                    <span className="sm:hidden">Terminal</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">Añadir Asistencia</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Actualización automática cada{" "}
                    {ASISTENCIAS_AUTO_REFRESH_MS / 1000}
                    s.
                    {isAutoRefreshing ? " Sincronizando asistencias..." : ""}
                  </span>
                  {lastUpdatedAt && (
                    <span>
                      Última actualización: {formatFrontendTime(lastUpdatedAt)}
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <AsistenciaTable
                    asistencias={paginatedAsistencias}
                    loading={loading}
                    totalAsistencias={totalAsistencias}
                    onEdit={(asistencia) => {
                      setSelectedAsistencia(asistencia);
                      setOpenModal(true);
                    }}
                    onView={(asistencia) => {
                      setAsistenciaVer(asistencia);
                      setOpenModalVer(true);
                    }}
                    onDelete={handleDeleteAsistencia}
                    onRegisterExit={handleRegisterExit}
                  />
                </div>

                {!loading && totalAsistencias > 0 && (
                  <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Mostrando{" "}
                      {(safeCurrentPage - 1) * ASISTENCIAS_PAGE_SIZE + 1} -{" "}
                      {Math.min(
                        safeCurrentPage * ASISTENCIAS_PAGE_SIZE,
                        totalAsistencias,
                      )}{" "}
                      de {totalAsistencias} asistencias ordenadas por ingreso
                      reciente.
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safeCurrentPage <= 1}
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                      >
                        Anterior
                      </Button>
                      <span className="min-w-[92px] text-center font-medium text-foreground">
                        Página {safeCurrentPage} de {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={safeCurrentPage >= totalPages}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1),
                          )
                        }
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <AsistenciaModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedAsistencia(null);
        }}
        onCreated={loadAsistencias}
        asistencia={selectedAsistencia}
      />

      <AsistenciaViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setAsistenciaVer(null);
        }}
        asistencia={asistenciaVer}
      />
    </SidebarProvider>
  );
}
