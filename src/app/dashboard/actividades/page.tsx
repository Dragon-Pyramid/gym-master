"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementType, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Layers,
  PlusCircle,
  RefreshCw,
  Search,
  Users,
  UserCheck,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import ActividadModal from "@/components/modal/ActividadModal";
import ActividadViewModal from "@/components/modal/ActividadViewModal";
import ActividadTable from "@/components/tables/ActividadTable";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { Actividad } from "@/interfaces/actividad.interface";
import type {
  ActividadBaseOption,
  ActividadInscripcionEstado,
  ActividadSocioOption,
  ActividadTurno,
  ActividadTurnoEstado,
  ActividadTurnoInscripcion,
  ActividadTurnosCuposDashboard,
} from "@/interfaces/actividadTurnosCupos.interface";
import { deleteActividad, fetchAllActividades } from "@/services/actividadService";
import {
  createActividadInscripcion,
  createActividadTurno,
  deleteActividadInscripcion,
  deleteActividadTurno,
  fetchActividadesTurnosCuposDashboard,
  updateActividadInscripcion,
  updateActividadTurno,
} from "@/services/actividadTurnosCuposService";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { formatFrontendDate, formatFrontendDateTime } from "@/utils/dateFormat";

const ACTIVIDADES_PAGE_SIZE = 8;
const CHART_COLORS = ["#02a8e1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

const ESTADOS_TURNO: Array<{ value: ActividadTurnoEstado; label: string }> = [
  { value: "activo", label: "Activo" },
  { value: "pausado", label: "Pausado" },
  { value: "cancelado", label: "Cancelado" },
];

const ESTADOS_INSCRIPCION: Array<{ value: ActividadInscripcionEstado; label: string }> = [
  { value: "inscripto", label: "Inscripto" },
  { value: "lista_espera", label: "Lista de espera" },
  { value: "asistio", label: "Asistió" },
  { value: "ausente", label: "Ausente" },
  { value: "cancelado", label: "Cancelado" },
];

type TurnoFormState = {
  id?: string;
  actividad_id: string;
  nombre_turno: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_maximo: string;
  cupo_minimo: string;
  instructor_id: string;
  ubicacion: string;
  estado: ActividadTurnoEstado;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
};

type InscripcionFormState = {
  turno_id: string;
  socio_id: string;
  observaciones: string;
};

const emptyTurnoForm: TurnoFormState = {
  actividad_id: "",
  nombre_turno: "",
  dia_semana: "1",
  hora_inicio: "08:00",
  hora_fin: "09:00",
  cupo_maximo: "20",
  cupo_minimo: "",
  instructor_id: "",
  ubicacion: "Sala principal",
  estado: "activo",
  fecha_inicio: "",
  fecha_fin: "",
  observaciones: "",
};

const emptyInscripcionForm: InscripcionFormState = {
  turno_id: "",
  socio_id: "",
  observaciones: "",
};

function diaLabel(value?: number | null) {
  return DIAS_SEMANA.find((dia) => dia.value === value)?.label ?? "Sin día";
}

function estadoLabel(value?: string | null) {
  if (!value) return "Sin estado";
  return value.replaceAll("_", " ");
}

function socioEstadoLabel(value?: ActividadInscripcionEstado | string | null) {
  if (value === "lista_espera") return "Solicitud pendiente";
  if (value === "inscripto") return "Inscripción aprobada";
  if (value === "asistio") return "Asistencia registrada";
  if (value === "ausente") return "Ausencia registrada";
  if (value === "cancelado") return "Cancelada";
  return "Sin estado";
}

function socioEstadoClass(value?: ActividadInscripcionEstado | string | null) {
  if (value === "lista_espera") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100";
  if (value === "inscripto" || value === "asistio") return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100";
  if (value === "cancelado" || value === "ausente") return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100";
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200";
}

function timeRange(turno: Pick<ActividadTurno, "hora_inicio" | "hora_fin">) {
  return `${String(turno.hora_inicio).slice(0, 5)} - ${String(turno.hora_fin).slice(0, 5)}`;
}

function percentLabel(value?: number | null) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  helper?: string;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50">{value}</p>
          {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        <div className="rounded-full bg-[#e6f7fd] p-3 text-[#02a8e1] dark:bg-cyan-950/40 dark:text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  );
}


function socioSearchLabel(socio: ActividadSocioOption) {
  return `${socio.nombre_completo}${socio.dni ? ` · DNI ${socio.dni}` : ""}`;
}

function normalizeSearch(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sanitizeActivity(actividad: ActividadBaseOption): Actividad {
  return {
    id: actividad.id,
    nombre_actividad: actividad.nombre_actividad,
    creado_en: actividad.creado_en ?? "",
    actualizado_en: actividad.actualizado_en ?? "",
  };
}

export default function ActividadesPage() {
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();
  const router = useRouter();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [filteredActividades, setFilteredActividades] = useState<Actividad[]>([]);
  const [dashboard, setDashboard] = useState<ActividadTurnosCuposDashboard | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [turnoSearchTerm, setTurnoSearchTerm] = useState("");
  const [diaFilter, setDiaFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingActividades, setLoadingActividades] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [submittingTurno, setSubmittingTurno] = useState(false);
  const [submittingInscripcion, setSubmittingInscripcion] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [actividadVer, setActividadVer] = useState<Actividad | null>(null);
  const [turnoForm, setTurnoForm] = useState<TurnoFormState>(emptyTurnoForm);
  const [inscripcionForm, setInscripcionForm] = useState<InscripcionFormState>(emptyInscripcionForm);
  const [socioSearchTerm, setSocioSearchTerm] = useState("");
  const [requestingTurnoId, setRequestingTurnoId] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadActividades = useCallback(async () => {
    setLoadingActividades(true);
    try {
      const data = await fetchAllActividades();
      setActividades(data ?? []);
      setFilteredActividades(data ?? []);
    } catch {
      toast.error("No se pudieron cargar las actividades");
    } finally {
      setLoadingActividades(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const data = await fetchActividadesTurnosCuposDashboard();
      setDashboard(data);

      if (data.actividades.length) {
        setActividades(data.actividades.map(sanitizeActivity));
      }

      if (!data.schema_ready) {
        toast.warning("Aplicá la migración privada para habilitar turnos, cupos e inscripciones.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar el dashboard de actividades";
      toast.error(message);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadActividades(), loadDashboard()]);
  }, [loadActividades, loadDashboard]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      refreshAll();
    }
  }, [isInitialized, isAuthenticated, refreshAll]);

  useEffect(() => {
    const clean = searchTerm.trim().toLowerCase();

    if (!clean) {
      setFilteredActividades(actividades);
      return;
    }

    setFilteredActividades(
      actividades.filter((actividad) => actividad.nombre_actividad.toLowerCase().includes(clean)),
    );
  }, [searchTerm, actividades]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const turnos = dashboard?.turnos ?? [];
  const inscripciones = dashboard?.inscripciones ?? [];
  const kpis = dashboard?.kpis;
  const actividadesOptions = dashboard?.actividades ?? actividades;
  const sociosOptions = dashboard?.socios ?? [];
  const empleadosOptions = dashboard?.empleados ?? [];
  const ubicacionesOptions = dashboard?.ubicaciones ?? [];
  const isSocioRole = user?.rol === "socio";
  const ownSocioId = String(user?.id_socio ?? user?.id ?? "");

  const selectedSocio = useMemo(
    () => sociosOptions.find((socio) => socio.id_socio === inscripcionForm.socio_id) ?? null,
    [inscripcionForm.socio_id, sociosOptions],
  );

  const filteredSociosOptions = useMemo(() => {
    const clean = normalizeSearch(socioSearchTerm);
    const selectedId = inscripcionForm.socio_id;

    if (!clean) {
      return sociosOptions.slice(0, 12);
    }

    return sociosOptions
      .filter((socio) => {
        const searchable = normalizeSearch(`${socio.nombre_completo} ${socio.dni ?? ""}`);
        return searchable.includes(clean);
      })
      .slice(0, 20)
      .sort((a, b) => Number(b.id_socio === selectedId) - Number(a.id_socio === selectedId));
  }, [inscripcionForm.socio_id, socioSearchTerm, sociosOptions]);

  const filteredTurnos = useMemo(() => {
    const clean = turnoSearchTerm.trim().toLowerCase();

    return turnos.filter((turno) => {
      const matchesDia = diaFilter === "todos" || String(turno.dia_semana) === diaFilter;
      const matchesEstado = estadoFilter === "todos" || turno.estado === estadoFilter;
      const searchable = [
        turno.nombre_turno,
        turno.actividad_nombre,
        turno.instructor_nombre,
        turno.ubicacion,
        diaLabel(turno.dia_semana),
        turno.estado,
      ]
        .join(" ")
        .toLowerCase();

      return matchesDia && matchesEstado && (!clean || searchable.includes(clean));
    });
  }, [diaFilter, estadoFilter, turnoSearchTerm, turnos]);

  const turnoById = useMemo(() => {
    return new Map(turnos.map((turno) => [turno.id, turno]));
  }, [turnos]);

  const pendingInscripciones = useMemo(() => {
    return inscripciones.filter((inscripcion) => inscripcion.estado === "lista_espera");
  }, [inscripciones]);

  const ownInscripciones = useMemo(() => {
    if (!ownSocioId) return [];
    return inscripciones.filter((inscripcion) => String(inscripcion.socio_id) === ownSocioId);
  }, [inscripciones, ownSocioId]);

  const activeOwnInscripcionByTurno = useMemo(() => {
    const map = new Map<string, ActividadTurnoInscripcion>();
    ownInscripciones
      .filter((inscripcion) => inscripcion.estado !== "cancelado")
      .forEach((inscripcion) => {
        if (!map.has(inscripcion.turno_id)) {
          map.set(inscripcion.turno_id, inscripcion);
        }
      });
    return map;
  }, [ownInscripciones]);

  const socioVisibleTurnos = useMemo(() => {
    return filteredTurnos.filter((turno) => turno.estado === "activo");
  }, [filteredTurnos]);

  const socioPendingRequests = ownInscripciones.filter((inscripcion) => inscripcion.estado === "lista_espera").length;
  const socioApprovedRequests = ownInscripciones.filter((inscripcion) => inscripcion.estado === "inscripto" || inscripcion.estado === "asistio").length;
  const socioAvailableSlots = socioVisibleTurnos.reduce((total, turno) => total + Math.max(0, Number(turno.cupos_disponibles ?? 0)), 0);

  const totalActividades = filteredActividades.length;
  const totalPages = Math.max(1, Math.ceil(totalActividades / ACTIVIDADES_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedActividades = filteredActividades.slice(
    (safeCurrentPage - 1) * ACTIVIDADES_PAGE_SIZE,
    safeCurrentPage * ACTIVIDADES_PAGE_SIZE,
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleDeleteActividad = async (actividad: Actividad) => {
    const confirmar = window.confirm(`¿Está seguro de eliminar la actividad "${actividad.nombre_actividad}"?`);
    if (!confirmar) return;

    try {
      await deleteActividad(actividad.id);
      toast.success("Actividad eliminada correctamente");
      await refreshAll();
    } catch {
      toast.error("Error al eliminar actividad");
    }
  };

  const resetTurnoForm = () => setTurnoForm(emptyTurnoForm);

  const handleEditTurno = (turno: ActividadTurno) => {
    setTurnoForm({
      id: turno.id,
      actividad_id: turno.actividad_id,
      nombre_turno: turno.nombre_turno,
      dia_semana: String(turno.dia_semana),
      hora_inicio: String(turno.hora_inicio).slice(0, 5),
      hora_fin: String(turno.hora_fin).slice(0, 5),
      cupo_maximo: String(turno.cupo_maximo),
      cupo_minimo: turno.cupo_minimo ? String(turno.cupo_minimo) : "",
      instructor_id: turno.instructor_id ?? "",
      ubicacion: turno.ubicacion ?? "",
      estado: turno.estado,
      fecha_inicio: turno.fecha_inicio ?? "",
      fecha_fin: turno.fecha_fin ?? "",
      observaciones: turno.observaciones ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitTurno = async (event: FormEvent) => {
    event.preventDefault();
    setSubmittingTurno(true);

    try {
      const payload = {
        actividad_id: turnoForm.actividad_id,
        nombre_turno: turnoForm.nombre_turno,
        dia_semana: Number(turnoForm.dia_semana),
        hora_inicio: turnoForm.hora_inicio,
        hora_fin: turnoForm.hora_fin,
        cupo_maximo: Number(turnoForm.cupo_maximo),
        cupo_minimo: turnoForm.cupo_minimo ? Number(turnoForm.cupo_minimo) : null,
        instructor_id: turnoForm.instructor_id || null,
        ubicacion: turnoForm.ubicacion || null,
        estado: turnoForm.estado,
        fecha_inicio: turnoForm.fecha_inicio || null,
        fecha_fin: turnoForm.fecha_fin || null,
        observaciones: turnoForm.observaciones || null,
      };

      if (turnoForm.id) {
        await updateActividadTurno(turnoForm.id, payload);
        toast.success("Turno actualizado correctamente");
      } else {
        await createActividadTurno(payload);
        toast.success("Turno creado correctamente");
      }

      resetTurnoForm();
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar turno";
      toast.error(message);
    } finally {
      setSubmittingTurno(false);
    }
  };

  const handleDeleteTurno = async (turno: ActividadTurno) => {
    const confirmar = window.confirm(`¿Eliminar el turno "${turno.nombre_turno}" y sus inscripciones?`);
    if (!confirmar) return;

    try {
      await deleteActividadTurno(turno.id);
      toast.success("Turno eliminado correctamente");
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar turno";
      toast.error(message);
    }
  };

  const handleSubmitInscripcion = async (event: FormEvent) => {
    event.preventDefault();
    setSubmittingInscripcion(true);

    try {
      await createActividadInscripcion({
        turno_id: inscripcionForm.turno_id,
        socio_id: inscripcionForm.socio_id,
        estado: "inscripto",
        observaciones: inscripcionForm.observaciones || null,
      });
      toast.success("Socio inscripto correctamente");
      setInscripcionForm(emptyInscripcionForm);
      setSocioSearchTerm("");
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al inscribir socio";
      toast.error(message);
    } finally {
      setSubmittingInscripcion(false);
    }
  };

  const handleUpdateInscripcionEstado = async (
    id: string,
    estado: ActividadInscripcionEstado,
    successMessage = "Inscripción actualizada",
  ) => {
    try {
      await updateActividadInscripcion(id, { estado });
      toast.success(successMessage);
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar inscripción";
      toast.error(message);
    }
  };

  const handleApproveInscripcion = async (inscripcion: ActividadTurnoInscripcion) => {
    const turno = turnoById.get(inscripcion.turno_id);
    const cuposDisponibles = Number(turno?.cupos_disponibles ?? 0);

    if (turno && cuposDisponibles <= 0) {
      toast.error("El turno no tiene cupo disponible. Mantené al socio en lista de espera o aumentá el cupo del turno.");
      return;
    }

    await handleUpdateInscripcionEstado(inscripcion.id, "inscripto", "Socio incorporado al turno");
  };

  const handleDeleteInscripcion = async (id: string) => {
    const confirmar = window.confirm("¿Eliminar esta inscripción?");
    if (!confirmar) return;

    try {
      await deleteActividadInscripcion(id);
      toast.success("Inscripción eliminada");
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar inscripción";
      toast.error(message);
    }
  };

  const handleSocioRequestInscripcion = async (turno: ActividadTurno) => {
    if (!ownSocioId) {
      toast.error("Tu usuario socio no tiene id_socio asociado. Contactá a administración.");
      return;
    }

    const current = activeOwnInscripcionByTurno.get(turno.id);
    if (current) {
      toast.info(`Ya tenés una solicitud o inscripción para este turno: ${socioEstadoLabel(current.estado)}.`);
      return;
    }

    setRequestingTurnoId(turno.id);
    try {
      await createActividadInscripcion({
        turno_id: turno.id,
        socio_id: ownSocioId,
        estado: "lista_espera",
        observaciones: "Solicitud enviada por el socio desde la app mobile. Pendiente de revisión administrativa.",
      });
      toast.success("Solicitud enviada a administración");
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo enviar la solicitud";
      toast.error(message);
    } finally {
      setRequestingTurnoId(null);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: "Actividades, turnos y cupos",
        subtitle: "Reporte operativo de clases, reservas, ocupación e inscripciones.",
        fileName: "actividades-turnos-cupos-gym-master",
        rows: filteredTurnos,
        metrics: [
          { label: "Actividades", value: kpis?.total_actividades ?? actividadesOptions.length },
          { label: "Turnos", value: kpis?.total_turnos ?? 0 },
          { label: "Inscriptos", value: kpis?.inscriptos ?? 0 },
          { label: "Cupos disponibles", value: kpis?.cupos_disponibles ?? 0 },
          { label: "Ocupación promedio", value: percentLabel(kpis?.ocupacion_promedio) },
        ],
        filtersLabel: `Día: ${diaFilter === "todos" ? "todos" : diaLabel(Number(diaFilter))}; Estado: ${estadoFilter}; Búsqueda: ${turnoSearchTerm || "sin búsqueda"}`,
        columns: [
          { header: "Actividad", width: 36, getValue: (turno) => turno.actividad_nombre ?? "" },
          { header: "Turno", width: 42, getValue: (turno) => turno.nombre_turno },
          { header: "Día", width: 25, getValue: (turno) => diaLabel(turno.dia_semana) },
          { header: "Horario", width: 28, getValue: (turno) => timeRange(turno) },
          { header: "Cupo", width: 18, getValue: (turno) => String(turno.cupo_maximo) },
          { header: "Inscriptos", width: 22, getValue: (turno) => String(turno.inscriptos) },
          { header: "Ocupación", width: 24, getValue: (turno) => percentLabel(turno.ocupacion_porcentaje) },
        ],
      });
    } catch {
      toast.error("No se pudo generar el PDF de actividades, turnos y cupos");
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const actividadesSheet = workbook.addWorksheet("Actividades");
    const turnosSheet = workbook.addWorksheet("Turnos");
    const inscripcionesSheet = workbook.addWorksheet("Inscripciones");

    actividadesSheet.columns = [
      { header: "ID", key: "id", width: 36 },
      { header: "Actividad", key: "nombre_actividad", width: 42 },
      { header: "Creado en", key: "creado_en", width: 24 },
    ];
    actividades.forEach((actividad) => {
      actividadesSheet.addRow({
        id: actividad.id,
        nombre_actividad: actividad.nombre_actividad,
        creado_en: formatFrontendDateTime(actividad.creado_en),
      });
    });

    turnosSheet.columns = [
      { header: "Actividad", key: "actividad", width: 35 },
      { header: "Turno", key: "turno", width: 35 },
      { header: "Día", key: "dia", width: 16 },
      { header: "Horario", key: "horario", width: 18 },
      { header: "Ubicación", key: "ubicacion", width: 25 },
      { header: "Instructor", key: "instructor", width: 30 },
      { header: "Estado", key: "estado", width: 16 },
      { header: "Cupo", key: "cupo", width: 10 },
      { header: "Inscriptos", key: "inscriptos", width: 12 },
      { header: "Lista espera", key: "lista_espera", width: 14 },
      { header: "Ocupación", key: "ocupacion", width: 14 },
    ];
    filteredTurnos.forEach((turno) => {
      turnosSheet.addRow({
        actividad: turno.actividad_nombre,
        turno: turno.nombre_turno,
        dia: diaLabel(turno.dia_semana),
        horario: timeRange(turno),
        ubicacion: turno.ubicacion,
        instructor: turno.instructor_nombre,
        estado: turno.estado,
        cupo: turno.cupo_maximo,
        inscriptos: turno.inscriptos,
        lista_espera: turno.lista_espera,
        ocupacion: percentLabel(turno.ocupacion_porcentaje),
      });
    });

    inscripcionesSheet.columns = [
      { header: "Actividad", key: "actividad", width: 35 },
      { header: "Turno", key: "turno", width: 35 },
      { header: "Socio", key: "socio", width: 35 },
      { header: "DNI", key: "dni", width: 15 },
      { header: "Estado", key: "estado", width: 18 },
      { header: "Fecha inscripción", key: "fecha", width: 24 },
    ];
    inscripciones.forEach((inscripcion) => {
      inscripcionesSheet.addRow({
        actividad: inscripcion.actividad_nombre,
        turno: inscripcion.turno_nombre,
        socio: inscripcion.socio_nombre,
        dni: inscripcion.socio_dni,
        estado: estadoLabel(inscripcion.estado),
        fecha: formatFrontendDateTime(inscripcion.fecha_inscripcion ?? ""),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildTimestampedDownloadFileName("actividades-turnos-cupos", "xlsx");
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isInitialized) return <div>Cargando...</div>;
  if (!isAuthenticated) return null;

  if (isSocioRole) {
    return (
      <SidebarProvider>
        <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-background">
          <AppSidebar />
          <SidebarInset className="!grid !h-[100dvh] !min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
            <AppHeader title="Mis actividades" />
            <section className="min-h-0 min-w-0 space-y-4 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-4 md:space-y-5 md:p-6">
              <QaFileNameBadge file="src/app/dashboard/actividades/page.tsx" />

              <section className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-600 via-cyan-600 to-slate-950 p-5 text-white shadow-xl shadow-indigo-950/20 dark:border-indigo-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-50">
                      <CalendarDays className="h-4 w-4" /> Solicitud de inscripción
                    </span>
                    <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Actividades y clases</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50/90">
                      Consultá horarios, cupos y ubicación. Enviá tu solicitud para que administración confirme la inscripción al turno elegido.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 text-center backdrop-blur">
                    <div className="rounded-xl bg-white/10 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase text-cyan-50/80">Turnos</p>
                      <p className="text-2xl font-black">{socioVisibleTurnos.length}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase text-cyan-50/80">Pendientes</p>
                      <p className="text-2xl font-black">{socioPendingRequests}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase text-cyan-50/80">Aprobadas</p>
                      <p className="text-2xl font-black">{socioApprovedRequests}</p>
                    </div>
                  </div>
                </div>
              </section>

              {dashboard?.warnings?.length ? (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                  <CardContent className="p-4 text-sm leading-6 text-amber-900 dark:text-amber-100">
                    <strong>Configuración pendiente:</strong> {dashboard.warnings.join(" ")}
                  </CardContent>
                </Card>
              ) : null}

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Turnos activos" value={socioVisibleTurnos.length} icon={CalendarDays} helper="Disponibles para solicitar" />
                <MetricCard title="Cupos libres" value={socioAvailableSlots} icon={Users} helper="Según agenda cargada" />
                <MetricCard title="Solicitudes" value={socioPendingRequests} icon={ListChecks} helper="Pendientes de revisión" />
                <MetricCard title="Confirmadas" value={socioApprovedRequests} icon={CheckCircle2} helper="Inscripciones aprobadas" />
              </section>

              <Card className="border-slate-200/80 dark:border-slate-800">
                <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
                  <div className="relative min-w-0">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={turnoSearchTerm}
                      onChange={(event) => setTurnoSearchTerm(event.target.value)}
                      placeholder="Buscar actividad, turno, instructor o ubicación..."
                      className="h-11 pl-9"
                    />
                  </div>
                  <select
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={diaFilter}
                    onChange={(event) => setDiaFilter(event.target.value)}
                  >
                    <option value="todos">Todos los días</option>
                    {DIAS_SEMANA.map((dia) => (
                      <option key={dia.value} value={String(dia.value)}>{dia.label}</option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              <section className="grid gap-3 xl:grid-cols-2">
                {loadingDashboard ? (
                  <Card className="xl:col-span-2">
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">Cargando actividades disponibles...</CardContent>
                  </Card>
                ) : socioVisibleTurnos.length === 0 ? (
                  <Card className="xl:col-span-2">
                    <CardContent className="p-8 text-center">
                      <CalendarDays className="mx-auto h-10 w-10 text-indigo-400" />
                      <p className="mt-3 text-lg font-black">No hay actividades disponibles</p>
                      <p className="mt-1 text-sm text-muted-foreground">Cuando administración cargue turnos activos, aparecerán acá para solicitar inscripción.</p>
                    </CardContent>
                  </Card>
                ) : (
                  socioVisibleTurnos.map((turno) => {
                    const currentInscripcion = activeOwnInscripcionByTurno.get(turno.id);
                    const hasRequest = Boolean(currentInscripcion);
                    const hasSlots = Number(turno.cupos_disponibles ?? 0) > 0;
                    const isSubmitting = requestingTurnoId === turno.id;
                    const disabled = isSubmitting || hasRequest || dashboard?.schema_ready === false || !ownSocioId;

                    return (
                      <Card key={turno.id} className="overflow-hidden border-slate-200/80 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-black uppercase text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
                                  {diaLabel(turno.dia_semana)}
                                </span>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${hasSlots ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-100"}`}>
                                  {hasSlots ? `${turno.cupos_disponibles} cupos libres` : "Lista de espera"}
                                </span>
                              </div>
                              <h2 className="mt-3 line-clamp-1 text-xl font-black text-slate-950 dark:text-slate-50">
                                {turno.actividad_nombre || "Actividad"}
                              </h2>
                              <p className="mt-1 line-clamp-1 text-sm font-semibold text-muted-foreground">{turno.nombre_turno}</p>
                            </div>
                            {currentInscripcion ? (
                              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${socioEstadoClass(currentInscripcion.estado)}`}>
                                {socioEstadoLabel(currentInscripcion.estado)}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 grid gap-2 rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-[#02a8e1]" />
                              <span>{timeRange(turno)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-[#02a8e1]" />
                              <span>{turno.inscriptos}/{turno.cupo_maximo} inscriptos</span>
                            </div>
                            <div className="sm:col-span-2 text-muted-foreground">
                              Instructor: <span className="font-semibold text-slate-900 dark:text-slate-100">{turno.instructor_nombre || "A confirmar"}</span>
                            </div>
                            <div className="sm:col-span-2 text-muted-foreground">
                              Ubicación: <span className="font-semibold text-slate-900 dark:text-slate-100">{turno.ubicacion || "A confirmar"}</span>
                            </div>
                          </div>

                          {turno.observaciones ? (
                            <p className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs leading-5 text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-100">
                              {turno.observaciones}
                            </p>
                          ) : null}

                          <Button
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSocioRequestInscripcion(turno)}
                            className="mt-4 w-full bg-[#02a8e1] font-black text-white hover:bg-[#0288b1] disabled:opacity-70"
                          >
                            {isSubmitting
                              ? "Enviando solicitud..."
                              : currentInscripcion
                                ? socioEstadoLabel(currentInscripcion.estado)
                                : hasSlots
                                  ? "Solicitar inscripción"
                                  : "Solicitar lista de espera"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </section>

              <Card className="border-indigo-200 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/20">
                <CardContent className="p-4 text-sm leading-6 text-indigo-950 dark:text-indigo-100">
                  Las solicitudes quedan registradas para revisión administrativa. Cuando administración apruebe o cambie el estado, lo vas a ver reflejado en esta pantalla.
                </CardContent>
              </Card>
            </section>
            <AppFooter />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="!grid !h-[100dvh] !min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
          <AppHeader title="Actividades" />
          <section className="min-h-0 min-w-0 space-y-5 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-4 md:space-y-6 md:p-6">
            <QaFileNameBadge file="src/app/dashboard/actividades/page.tsx" />

            {dashboard?.warnings?.length ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-sm text-amber-900">
                  <strong>Base de datos pendiente:</strong> {dashboard.warnings.join(" ")}
                </CardContent>
              </Card>
            ) : null}

            <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard title="Actividades" value={kpis?.total_actividades ?? actividades.length} icon={Layers} />
              <MetricCard title="Turnos" value={kpis?.total_turnos ?? 0} icon={CalendarDays} helper={`${kpis?.turnos_activos ?? 0} activos`} />
              <MetricCard title="Cupos totales" value={kpis?.cupos_totales ?? 0} icon={Users} />
              <MetricCard title="Inscriptos" value={kpis?.inscriptos ?? 0} icon={UserCheck} />
              <MetricCard title="Lista espera" value={kpis?.lista_espera ?? 0} icon={ListChecks} />
              <MetricCard title="Ocupación" value={percentLabel(kpis?.ocupacion_promedio)} icon={CheckCircle2} />
            </section>

            <section className="grid min-w-0 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader className="border-b p-4">
                  <h2 className="text-xl font-bold">BI de turnos y cupos</h2>
                  <p className="text-sm text-muted-foreground">
                    Ocupación por actividad, distribución semanal y estado de inscripciones.
                  </p>
                </CardHeader>
                <CardContent className="grid min-w-0 gap-4 p-3 sm:p-4 lg:grid-cols-2">
                  <div className="min-w-0 rounded-xl border p-3 sm:p-4">
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <CalendarDays className="h-4 w-4" /> Turnos por día
                    </div>
                    {dashboard?.por_dia?.length ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={dashboard.por_dia}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="total" name="Turnos" fill="#02a8e1" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart label="Sin turnos para graficar." />
                    )}
                  </div>

                  <div className="min-w-0 rounded-xl border p-3 sm:p-4">
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <Users className="h-4 w-4" /> Estado de inscripciones
                    </div>
                    {dashboard?.por_estado_inscripcion?.length ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={dashboard.por_estado_inscripcion} dataKey="total" nameKey="label" outerRadius={85} label>
                            {dashboard.por_estado_inscripcion.map((entry, index) => (
                              <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart label="Sin inscripciones para graficar." />
                    )}
                  </div>

                  <div className="min-w-0 rounded-xl border p-3 sm:p-4 lg:col-span-2">
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <Layers className="h-4 w-4" /> Inscriptos por actividad
                    </div>
                    {dashboard?.por_actividad?.length ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={dashboard.por_actividad} layout="vertical" margin={{ left: 24, right: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="total" name="Inscriptos" fill="#22c55e" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChart label="Sin ocupación por actividad." />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b p-4">
                  <h2 className="text-xl font-bold">Crear / editar turno</h2>
                  <p className="text-sm text-muted-foreground">
                    Definí horario, cupo, instructor, ubicación y estado operativo.
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleSubmitTurno} className="grid gap-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Actividad</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={turnoForm.actividad_id}
                          onChange={(event) => setTurnoForm((prev) => ({ ...prev, actividad_id: event.target.value }))}
                          required
                        >
                          <option value="">Seleccionar actividad</option>
                          {actividadesOptions.map((actividad) => (
                            <option key={actividad.id} value={actividad.id}>
                              {actividad.nombre_actividad}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Nombre del turno</Label>
                        <Input
                          value={turnoForm.nombre_turno}
                          onChange={(event) => setTurnoForm((prev) => ({ ...prev, nombre_turno: event.target.value }))}
                          placeholder="Funcional tarde / Spinning 19 hs"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Día</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={turnoForm.dia_semana}
                          onChange={(event) => setTurnoForm((prev) => ({ ...prev, dia_semana: event.target.value }))}
                        >
                          {DIAS_SEMANA.map((dia) => (
                            <option key={dia.value} value={dia.value}>
                              {dia.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Estado</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={turnoForm.estado}
                          onChange={(event) => setTurnoForm((prev) => ({ ...prev, estado: event.target.value as ActividadTurnoEstado }))}
                        >
                          {ESTADOS_TURNO.map((estado) => (
                            <option key={estado.value} value={estado.value}>
                              {estado.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Inicio</Label>
                        <Input type="time" value={turnoForm.hora_inicio} onChange={(event) => setTurnoForm((prev) => ({ ...prev, hora_inicio: event.target.value }))} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Fin</Label>
                        <Input type="time" value={turnoForm.hora_fin} onChange={(event) => setTurnoForm((prev) => ({ ...prev, hora_fin: event.target.value }))} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Cupo máximo</Label>
                        <Input type="number" min={1} value={turnoForm.cupo_maximo} onChange={(event) => setTurnoForm((prev) => ({ ...prev, cupo_maximo: event.target.value }))} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Cupo mínimo</Label>
                        <Input type="number" min={0} value={turnoForm.cupo_minimo} onChange={(event) => setTurnoForm((prev) => ({ ...prev, cupo_minimo: event.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Instructor</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={turnoForm.instructor_id}
                          onChange={(event) => setTurnoForm((prev) => ({ ...prev, instructor_id: event.target.value }))}
                        >
                          <option value="">Sin instructor asignado</option>
                          {empleadosOptions.map((empleado) => (
                            <option key={empleado.id} value={empleado.id}>
                              {empleado.nombre_completo}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Ubicación</Label>
                        {ubicacionesOptions.length ? (
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={turnoForm.ubicacion}
                            onChange={(event) =>
                              setTurnoForm((prev) => ({ ...prev, ubicacion: event.target.value }))
                            }
                          >
                            <option value="">Seleccionar ubicación</option>
                            {ubicacionesOptions.map((ubicacion) => (
                              <option key={ubicacion.id} value={ubicacion.nombre}>
                                {ubicacion.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            value={turnoForm.ubicacion}
                            onChange={(event) =>
                              setTurnoForm((prev) => ({ ...prev, ubicacion: event.target.value }))
                            }
                            placeholder="Sala 1 / Box / Spinning"
                          />
                        )}
                        <p className="text-xs text-muted-foreground">
                          Las ubicaciones se administran desde Parametrización → Ubicaciones del gimnasio.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Vigencia desde</Label>
                        <Input type="date" value={turnoForm.fecha_inicio} onChange={(event) => setTurnoForm((prev) => ({ ...prev, fecha_inicio: event.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Vigencia hasta</Label>
                        <Input type="date" value={turnoForm.fecha_fin} onChange={(event) => setTurnoForm((prev) => ({ ...prev, fecha_fin: event.target.value }))} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Observaciones</Label>
                        <Input value={turnoForm.observaciones} onChange={(event) => setTurnoForm((prev) => ({ ...prev, observaciones: event.target.value }))} placeholder="Requisitos, nivel, material necesario..." />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                      {turnoForm.id ? (
                        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={resetTurnoForm}>
                          Cancelar edición
                        </Button>
                      ) : null}
                      <Button type="submit" disabled={submittingTurno || dashboard?.schema_ready === false} className="w-full bg-[#02a8e1] hover:bg-[#0288b1] sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {submittingTurno ? "Guardando..." : turnoForm.id ? "Actualizar turno" : "Crear turno"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader className="flex flex-col gap-4 border-b p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Turnos, cupos e inscripciones</h2>
                  <p className="text-sm text-muted-foreground">
                    Control de clases por día, cupos disponibles, ocupación y lista de espera.
                  </p>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-row lg:items-center">
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-auto" value={diaFilter} onChange={(event) => setDiaFilter(event.target.value)}>
                    <option value="todos">Todos los días</option>
                    {DIAS_SEMANA.map((dia) => (
                      <option key={dia.value} value={dia.value}>{dia.label}</option>
                    ))}
                  </select>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm lg:w-auto" value={estadoFilter} onChange={(event) => setEstadoFilter(event.target.value)}>
                    <option value="todos">Todos los estados</option>
                    {ESTADOS_TURNO.map((estado) => (
                      <option key={estado.value} value={estado.value}>{estado.label}</option>
                    ))}
                  </select>
                  <div className="relative min-w-0 flex-grow lg:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="w-full pl-8 lg:w-[280px]" value={turnoSearchTerm} onChange={(event) => setTurnoSearchTerm(event.target.value)} placeholder="Buscar turno, actividad, zona..." />
                  </div>
                  <Button variant="outline" onClick={handleDownloadPdf} className="flex w-full items-center justify-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] lg:w-auto">
                    <FileText className="h-4 w-4" /> PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel} className="flex w-full items-center justify-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] lg:w-auto">
                    <FileSpreadsheet className="h-4 w-4" /> Excel
                  </Button>
                  <Button variant="outline" onClick={loadDashboard} disabled={loadingDashboard} className="w-full lg:w-auto">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loadingDashboard ? "animate-spin" : ""}`} /> Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {loadingDashboard ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Cargando turnos y cupos...</div>
                ) : filteredTurnos.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">No hay turnos cargados para los filtros actuales.</div>
                ) : (
                  <>
                    <div className="grid gap-3 md:hidden">
                      {filteredTurnos.map((turno) => (
                        <div key={turno.id} className="rounded-xl border bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950">{turno.actividad_nombre}</p>
                              <p className="truncate text-xs text-muted-foreground">{turno.nombre_turno}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${turno.estado === "activo" ? "bg-emerald-100 text-emerald-700" : turno.estado === "pausado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                              {estadoLabel(turno.estado)}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Clock className="h-4 w-4 shrink-0 text-[#02a8e1]" />
                              <span>{diaLabel(turno.dia_semana)} · {timeRange(turno)}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Instructor: <span className="text-slate-900">{turno.instructor_nombre || "Sin instructor"}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Ubicación: <span className="text-slate-900">{turno.ubicacion || "Sin ubicación"}</span>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold">{turno.inscriptos}/{turno.cupo_maximo} inscriptos</span>
                                <span className="text-xs text-muted-foreground">{Math.min(100, turno.ocupacion_porcentaje)}%</span>
                              </div>
                              <div className="mt-1 h-2 rounded-full bg-slate-100">
                                <div className="h-2 rounded-full bg-[#02a8e1]" style={{ width: `${Math.min(100, turno.ocupacion_porcentaje)}%` }} />
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Disponibles: {turno.cupos_disponibles} · Espera: {turno.lista_espera}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditTurno(turno)}>Editar</Button>
                            <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={() => handleDeleteTurno(turno)}>Eliminar</Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto rounded-md border md:block">
                      <Table className="min-w-[1050px] overflow-hidden text-sm">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Actividad / turno</TableHead>
                            <TableHead>Día y horario</TableHead>
                            <TableHead>Instructor</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Cupos</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTurnos.map((turno) => (
                            <TableRow key={turno.id} className="odd:bg-muted/30">
                              <TableCell>
                                <div className="font-semibold">{turno.actividad_nombre}</div>
                                <div className="text-xs text-muted-foreground">{turno.nombre_turno}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#02a8e1]" /> {diaLabel(turno.dia_semana)}</div>
                                <div className="text-xs text-muted-foreground">{timeRange(turno)}</div>
                              </TableCell>
                              <TableCell>{turno.instructor_nombre || "Sin instructor"}</TableCell>
                              <TableCell>{turno.ubicacion || "Sin ubicación"}</TableCell>
                              <TableCell>
                                <div className="font-semibold">{turno.inscriptos}/{turno.cupo_maximo}</div>
                                <div className="text-xs text-muted-foreground">Disponibles: {turno.cupos_disponibles} · Espera: {turno.lista_espera}</div>
                                <div className="mt-1 h-2 w-28 rounded-full bg-slate-100">
                                  <div className="h-2 rounded-full bg-[#02a8e1]" style={{ width: `${Math.min(100, turno.ocupacion_porcentaje)}%` }} />
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${turno.estado === "activo" ? "bg-emerald-100 text-emerald-700" : turno.estado === "pausado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                  {estadoLabel(turno.estado)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditTurno(turno)}>Editar</Button>
                                  <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={() => handleDeleteTurno(turno)}>Eliminar</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900/70 dark:bg-amber-950/20">
              <CardHeader className="border-b border-amber-200/70 p-4 dark:border-amber-900/60">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-amber-950 dark:text-amber-100">Solicitudes pendientes</h2>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Socios que solicitaron inscripción desde mobile y esperan aprobación administrativa.
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                    {pendingInscripciones.length} pendientes
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {pendingInscripciones.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-amber-300 bg-white/80 p-5 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-slate-950/30 dark:text-amber-100">
                    No hay socios en lista de espera pendientes de aprobación.
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {pendingInscripciones.slice(0, 12).map((inscripcion) => {
                      const turno = turnoById.get(inscripcion.turno_id);
                      const cuposDisponibles = Number(turno?.cupos_disponibles ?? 0);
                      const hasCupo = !turno || cuposDisponibles > 0;

                      return (
                        <div key={inscripcion.id} className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm dark:border-amber-900/70 dark:bg-slate-950/60">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950 dark:text-slate-50">{inscripcion.socio_nombre}</p>
                              <p className="text-xs text-muted-foreground">{inscripcion.socio_dni || "Sin DNI"}</p>
                              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{inscripcion.actividad_nombre}</p>
                              <p className="text-xs text-muted-foreground">{inscripcion.turno_nombre}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Solicitud: {formatFrontendDate(inscripcion.fecha_inscripcion ?? "")}
                              </p>
                            </div>
                            <div className="rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                              <div className="font-semibold">Cupos</div>
                              <div>{turno ? `${turno.inscriptos}/${turno.cupo_maximo}` : "Sin dato"}</div>
                              <div className={hasCupo ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>
                                {turno ? `${cuposDisponibles} disponibles` : "Verificar turno"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                              disabled={!hasCupo}
                              onClick={() => handleApproveInscripcion(inscripcion)}
                              title={!hasCupo ? "El turno no tiene cupo disponible" : "Incorporar al socio al turno"}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Incorporar al turno
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                              onClick={() => handleUpdateInscripcionEstado(inscripcion.id, "cancelado", "Solicitud cancelada")}
                            >
                              Cancelar solicitud
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
              <Card>
                <CardHeader className="border-b p-4">
                  <h2 className="text-xl font-bold">Inscribir socio</h2>
                  <p className="text-sm text-muted-foreground">Si el cupo está completo, el socio pasa automáticamente a lista de espera.</p>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleSubmitInscripcion} className="grid gap-3">
                    <div className="space-y-1.5">
                      <Label>Turno</Label>
                      <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={inscripcionForm.turno_id} onChange={(event) => setInscripcionForm((prev) => ({ ...prev, turno_id: event.target.value }))} required>
                        <option value="">Seleccionar turno</option>
                        {turnos.filter((turno) => turno.estado === "activo").map((turno) => (
                          <option key={turno.id} value={turno.id}>{turno.actividad_nombre} · {turno.nombre_turno} · {diaLabel(turno.dia_semana)} {String(turno.hora_inicio).slice(0, 5)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Socio</Label>
                      <div className="rounded-lg border bg-white p-3 shadow-sm">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={socioSearchTerm}
                            onChange={(event) => setSocioSearchTerm(event.target.value)}
                            placeholder="Buscar por nombre o DNI..."
                            className="pl-8"
                          />
                        </div>

                        {selectedSocio ? (
                          <div className="mt-2 flex items-center justify-between rounded-md border border-[#02a8e1]/30 bg-[#e6f7fd] px-3 py-2 text-sm">
                            <div>
                              <p className="font-semibold text-slate-950">{selectedSocio.nombre_completo}</p>
                              <p className="text-xs text-slate-500">{selectedSocio.dni ? `DNI ${selectedSocio.dni}` : "Sin DNI cargado"}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setInscripcionForm((prev) => ({ ...prev, socio_id: "" }));
                                setSocioSearchTerm("");
                              }}
                            >
                              Cambiar
                            </Button>
                          </div>
                        ) : null}

                        <div className="mt-2 max-h-52 overflow-auto rounded-md border">
                          {filteredSociosOptions.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                              No se encontraron socios para esa búsqueda.
                            </div>
                          ) : (
                            filteredSociosOptions.map((socio) => {
                              const isSelected = socio.id_socio === inscripcionForm.socio_id;
                              return (
                                <button
                                  key={socio.id_socio}
                                  type="button"
                                  className={`flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm transition last:border-b-0 ${
                                    isSelected ? "bg-[#e6f7fd] text-slate-950" : "bg-white hover:bg-slate-50"
                                  }`}
                                  onClick={() => {
                                    setInscripcionForm((prev) => ({ ...prev, socio_id: socio.id_socio }));
                                    setSocioSearchTerm(socioSearchLabel(socio));
                                  }}
                                >
                                  <span>
                                    <span className="block font-medium">{socio.nombre_completo}</span>
                                    <span className="block text-xs text-muted-foreground">
                                      {socio.dni ? `DNI ${socio.dni}` : "Sin DNI cargado"}
                                    </span>
                                  </span>
                                  {isSelected ? <CheckCircle2 className="h-4 w-4 text-[#02a8e1]" /> : null}
                                </button>
                              );
                            })
                          )}
                        </div>

                        <div className="mt-2 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Selector rápido</Label>
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={inscripcionForm.socio_id}
                            onChange={(event) => {
                              const socio = sociosOptions.find((item) => item.id_socio === event.target.value);
                              setInscripcionForm((prev) => ({ ...prev, socio_id: event.target.value }));
                              setSocioSearchTerm(socio ? socioSearchLabel(socio) : "");
                            }}
                            required
                          >
                            <option value="">Seleccionar socio</option>
                            {sociosOptions.map((socio) => (
                              <option key={socio.id_socio} value={socio.id_socio}>
                                {socioSearchLabel(socio)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Observaciones</Label>
                      <Input value={inscripcionForm.observaciones} onChange={(event) => setInscripcionForm((prev) => ({ ...prev, observaciones: event.target.value }))} placeholder="Aclaración opcional" />
                    </div>
                    <Button type="submit" disabled={submittingInscripcion || dashboard?.schema_ready === false} className="bg-[#02a8e1] hover:bg-[#0288b1]">
                      {submittingInscripcion ? "Inscribiendo..." : "Inscribir socio"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b p-4">
                  <h2 className="text-xl font-bold">Inscripciones recientes</h2>
                  <p className="text-sm text-muted-foreground">Marcá asistencia, ausencia, cancelación o lista de espera.</p>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="max-h-[430px] overflow-auto rounded-md border p-2 md:p-0">
                    <div className="grid gap-3 md:hidden">
                      {inscripciones.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">Sin inscripciones registradas.</div>
                      ) : inscripciones.slice(0, 40).map((inscripcion) => (
                        <div key={inscripcion.id} className="rounded-xl border bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950">{inscripcion.socio_nombre}</p>
                              <p className="text-xs text-muted-foreground">{inscripcion.socio_dni || "Sin DNI"}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                              {estadoLabel(inscripcion.estado)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-700">
                            <p>{inscripcion.actividad_nombre}</p>
                            <p className="text-xs text-muted-foreground">{inscripcion.turno_nombre}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatFrontendDate(inscripcion.fecha_inscripcion ?? "")}</p>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {inscripcion.estado === "lista_espera" ? (
                              <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleApproveInscripcion(inscripcion)}>
                                  Incorporar
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleUpdateInscripcionEstado(inscripcion.id, "cancelado", "Solicitud cancelada")}>
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {ESTADOS_INSCRIPCION.map((estado) => (
                                  <Button key={estado.value} size="sm" variant="outline" onClick={() => handleUpdateInscripcionEstado(inscripcion.id, estado.value)}>{estado.label}</Button>
                                ))}
                              </div>
                            )}
                            <Button size="sm" className="w-full bg-red-500 text-white hover:bg-red-600" onClick={() => handleDeleteInscripcion(inscripcion.id)}>Eliminar</Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Table className="hidden min-w-[780px] text-sm md:table">
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Socio</TableHead>
                          <TableHead>Turno</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inscripciones.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Sin inscripciones registradas.</TableCell></TableRow>
                        ) : inscripciones.slice(0, 40).map((inscripcion) => (
                          <TableRow key={inscripcion.id}>
                            <TableCell>
                              <div className="font-medium">{inscripcion.socio_nombre}</div>
                              <div className="text-xs text-muted-foreground">{inscripcion.socio_dni || "Sin DNI"}</div>
                            </TableCell>
                            <TableCell>
                              <div>{inscripcion.actividad_nombre}</div>
                              <div className="text-xs text-muted-foreground">{inscripcion.turno_nombre}</div>
                            </TableCell>
                            <TableCell>{estadoLabel(inscripcion.estado)}</TableCell>
                            <TableCell>{formatFrontendDate(inscripcion.fecha_inscripcion ?? "")}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {inscripcion.estado === "lista_espera" ? (
                                  <>
                                    <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleApproveInscripcion(inscripcion)}>
                                      Incorporar al turno
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleUpdateInscripcionEstado(inscripcion.id, "cancelado", "Solicitud cancelada")}>
                                      Cancelar solicitud
                                    </Button>
                                  </>
                                ) : (
                                  ESTADOS_INSCRIPCION.map((estado) => (
                                    <Button key={estado.value} size="sm" variant="outline" onClick={() => handleUpdateInscripcionEstado(inscripcion.id, estado.value)}>{estado.label}</Button>
                                  ))
                                )}
                                <Button size="sm" className="bg-red-500 text-white hover:bg-red-600" onClick={() => handleDeleteInscripcion(inscripcion.id)}>Eliminar</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="w-full">
              <CardHeader className="flex flex-col gap-4 border-b p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">Catálogo de actividades</h2>
                  <p className="text-sm text-muted-foreground">Base de actividades usada para crear turnos y cupos.</p>
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-[1fr_auto] lg:w-auto">
                  <div className="relative min-w-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar actividad..." className="w-full pl-8 lg:w-[300px]" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                  </div>
                  <Button onClick={() => setOpenModal(true)} className="w-full bg-[#02a8e1] hover:bg-[#0288b1] sm:w-auto">
                    Añadir Actividad
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-3 sm:p-4">
                <div className="max-w-full overflow-hidden">
                  <ActividadTable
                    actividades={paginatedActividades}
                    loading={loadingActividades}
                    onEdit={(actividad) => {
                      setSelectedActividad(actividad);
                      setOpenModal(true);
                    }}
                    onView={(actividad) => {
                      setActividadVer(actividad);
                      setOpenModalVer(true);
                    }}
                    onDelete={handleDeleteActividad}
                  />
                </div>
                <PaginationControls currentPage={safeCurrentPage} totalItems={totalActividades} pageSize={ACTIVIDADES_PAGE_SIZE} onPageChange={setCurrentPage} itemLabel="actividades" />
              </CardContent>
            </Card>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>

      <ActividadModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedActividad(null);
        }}
        onCreated={refreshAll}
        actividad={selectedActividad}
      />

      <ActividadViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setActividadVer(null);
        }}
        actividad={actividadVer}
      />
    </SidebarProvider>
  );
}
