"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/i18n/I18nProvider";
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


function translateAforoEstado(value: string | undefined, isEnglish: boolean) {
  if (!value) return "--";

  if (!isEnglish) {
    return value;
  }

  const normalized = value.toLowerCase();

  if (normalized === "normal") return "Normal";
  if (normalized === "moderado") return "Moderate";
  if (normalized === "alto") return "High";
  if (normalized === "critico" || normalized === "crítico") return "Critical";

  return value;
}

function translateAforoMessage(message: string | undefined, isEnglish: boolean) {
  if (!message) {
    return isEnglish ? "No capacity data." : "Sin datos de aforo.";
  }

  if (!isEnglish) {
    return message;
  }

  const translations: Record<string, string> = {
    "Ocupación normal. Hay disponibilidad operativa.":
      "Normal occupancy. Operational capacity is available.",
    "Ocupación moderada. El gimnasio opera con margen disponible.":
      "Moderate occupancy. The gym is operating with available margin.",
    "Ocupación alta. Recomendado monitorear accesos y horarios pico.":
      "High occupancy. Monitor access points and peak hours.",
    "Ocupación crítica. Activar control de aforo y limitar nuevos ingresos.":
      "Critical occupancy. Activate capacity control and limit new entries.",
  };

  return translations[message] ?? message;
}

function getAttendancePeriodExportLabel(
  periodFilter: string,
  attendanceText: (es: string, en: string) => string,
) {
  const labels: Record<string, string> = {
    todos: attendanceText("todos", "all"),
    dia: attendanceText("hoy", "today"),
    semana: attendanceText("últimos 7 días", "last 7 days"),
    mes: attendanceText("mes actual", "current month"),
    anio: attendanceText("año actual", "current year"),
  };

  return labels[periodFilter] ?? periodFilter;
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
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const attendanceText = (es: string, en: string) => (isEnglish ? en : es);
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
    const periodLabel = getAttendancePeriodExportLabel(
      periodFilter,
      attendanceText,
    );
    const search = searchTerm.trim();
    const filterParts = [
      `${attendanceText("Período", "Period")}: ${periodLabel}` ,
      fechaDesde ? `${attendanceText("Desde", "From")}: ${fechaDesde}` : "",
      fechaHasta ? `${attendanceText("Hasta", "To")}: ${fechaHasta}` : "",
      search ? `${attendanceText("Búsqueda", "Search")}: ${search}` : "",
    ].filter(Boolean);

    try {
      await downloadCommercialReportPdf({
        title: attendanceText("Listado de Asistencias", "Attendance list"),
        subtitle: attendanceText(
          "Reporte de ingresos, egresos y filtros de asistencia.",
          "Check-in, check-out, and attendance filter report.",
        ),
        fileName: attendanceText(
          "listado-asistencias-gym-master",
          "attendance-list-gym-master",
        ),
        locale,
        footerText: attendanceText(
          "Documento generado por Gym Master.",
          "Document generated by Gym Master.",
        ),
        labels: {
          generated: attendanceText("Generado", "Generated"),
          page: attendanceText("Página", "Page"),
          of: attendanceText("de", "of"),
          detail: attendanceText("Detalle", "Details"),
          records: attendanceText("registros", "records"),
          empty: attendanceText(
            "No hay registros para el filtro seleccionado.",
            "No records found for the selected filter.",
          ),
        },
        rows: filteredAsistencias,
        metrics: [
          {
            label: attendanceText(
              "Asistencias filtradas",
              "Filtered attendances",
            ),
            value: filteredAsistencias.length,
          },
        ],
        filtersLabel: filterParts.join(" · "),
        columns: [
          {
            header: attendanceText("Socio", "Member"),
            width: 48,
            getValue: (a) => a.socio?.nombre_completo || a.socio_id,
          },
          {
            header: attendanceText("Fecha", "Date"),
            width: 26,
            getValue: (a) => a.fecha,
          },
          {
            header: attendanceText("Hora ingreso", "Check-in time"),
            width: 28,
            getValue: (a) => a.hora_ingreso || "-",
          },
          {
            header: attendanceText("Hora egreso", "Check-out time"),
            width: 28,
            getValue: (a) => a.hora_egreso || "-",
          },
          {
            header: attendanceText("ID socio", "Member ID"),
            width: 56,
            getValue: (a) => a.socio_id,
          },
        ],
      });
    } catch {
      toast.error(
        attendanceText(
          "No se pudo generar el PDF de asistencias",
          "Could not generate the attendances PDF",
        ),
      );
    }
  };
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      attendanceText("Asistencias", "Attendances"),
    );

    worksheet.columns = [
      {
        header: attendanceText("ID Asistencia", "Attendance ID"),
        key: "id",
        width: 22,
      },
      {
        header: attendanceText("Socio", "Member"),
        key: "socio",
        width: 32,
      },
      {
        header: attendanceText("ID Socio", "Member ID"),
        key: "socio_id",
        width: 38,
      },
      { header: attendanceText("Fecha", "Date"), key: "fecha", width: 15 },
      {
        header: attendanceText("Hora ingreso", "Check-in time"),
        key: "hora_ingreso",
        width: 18,
      },
      {
        header: attendanceText("Hora egreso", "Check-out time"),
        key: "hora_egreso",
        width: 18,
      },
    ];

    filteredAsistencias.forEach((a) => {
      worksheet.addRow({
        id: a.id,
        socio: a.socio?.nombre_completo || "",
        socio_id: a.socio_id,
        fecha: a.fecha,
        hora_ingreso: a.hora_ingreso,
        hora_egreso: a.hora_egreso,
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
      attendanceText("listado-asistencias", "attendance-list"),
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
      toast.success(attendanceText("Asistencia eliminada correctamente", "Attendance deleted successfully"));
      await loadAsistencias();
    } catch (error: unknown) {
      toast.error(attendanceText("Error al eliminar asistencia", "Error deleting attendance"));
    }
  };

  const handleRegisterExit = async (asistencia: Asistencia) => {
    const socioNombre =
      asistencia.socio?.nombre_completo || asistencia.socio_id;
    const confirmar = window.confirm(`¿Registrar salida para ${socioNombre}?`);
    if (!confirmar) return;

    try {
      const response = await registrarSalidaAdministrativa(asistencia.id);
      toast.success(response.message || attendanceText("Salida registrada correctamente", "Exit registered successfully"));
      await loadAsistencias({ silent: true, resetPage: false });
    } catch (error: unknown) {
      toast.error((error as Error).message || attendanceText("No se pudo registrar la salida", "Could not register the exit"));
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
    return <div>{attendanceText("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={attendanceText("Asistencias", "Attendances")} />
          <main className="flex-1 p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-emerald-100 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {attendanceText("Dentro ahora", "Inside now")}
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
                    {attendanceText("Capacidad configurada", "Configured capacity")}
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
                    {attendanceText("Ocupación", "Occupancy")}
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
                      {attendanceText("Estado", "Status")}
                    </p>
                  </div>
                  <p className="mt-1 text-xl font-black capitalize">
                    {translateAforoEstado(aforo?.estado, isEnglish)}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {translateAforoMessage(aforo?.mensaje_estado, isEnglish)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">{attendanceText("Listado de Asistencias", "Attendance roster")}</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={attendanceText("Buscar...", "Search...")}
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
                    <option value="todos">{attendanceText("Todos los períodos", "All periods")}</option>
                    <option value="dia">{attendanceText("Hoy", "Today")}</option>
                    <option value="semana">{attendanceText("Últimos 7 días", "Last 7 days")}</option>
                    <option value="mes">{attendanceText("Mes actual", "Current month")}</option>
                    <option value="anio">{attendanceText("Año actual", "Current year")}</option>
                  </select>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-[150px]"
                    title={attendanceText("Fecha desde", "Date from")}
                  />
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-[150px]"
                    title={attendanceText("Fecha hasta", "Date to")}
                  />
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">{attendanceText("Descargar PDF", "Download PDF")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">{attendanceText("Exportar", "Export")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/asistencias/aforo")}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">{attendanceText("Salida / Aforo", "Exit / Capacity")}</span>
                    <span className="sm:hidden">{attendanceText("Aforo", "Capacity")}</span>
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
                    <span className="hidden sm:inline">{attendanceText("Modo terminal", "Terminal mode")}</span>
                    <span className="sm:hidden">Terminal</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">{attendanceText("Añadir Asistencia", "Add attendance")}</span>
                    <span className="sm:hidden">{attendanceText("Añadir", "Add")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {attendanceText("Actualización automática cada", "Automatic refresh every")}{" "}
                    {ASISTENCIAS_AUTO_REFRESH_MS / 1000}
                    s.
                    {isAutoRefreshing
                      ? attendanceText(" Sincronizando asistencias...", " Syncing attendances...")
                      : ""}
                  </span>
                  {lastUpdatedAt && (
                    <span>
                      {attendanceText("Última actualización", "Last update")}: {formatFrontendTime(lastUpdatedAt)}
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
                      {isEnglish
                        ? `Showing ${(safeCurrentPage - 1) * ASISTENCIAS_PAGE_SIZE + 1} - ${Math.min(
                            safeCurrentPage * ASISTENCIAS_PAGE_SIZE,
                            totalAsistencias,
                          )} of ${totalAsistencias} attendances ordered by recent check-in.`
                        : `Mostrando ${(safeCurrentPage - 1) * ASISTENCIAS_PAGE_SIZE + 1} - ${Math.min(
                            safeCurrentPage * ASISTENCIAS_PAGE_SIZE,
                            totalAsistencias,
                          )} de ${totalAsistencias} asistencias ordenadas por ingreso reciente.`}
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
                      >{attendanceText("Anterior", "Previous")}</Button>
                      <span className="min-w-[92px] text-center font-medium text-foreground">
                        {attendanceText("Página", "Page")} {safeCurrentPage} {attendanceText("de", "of")} {totalPages}
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
                      >{attendanceText("Siguiente", "Next")}</Button>
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
