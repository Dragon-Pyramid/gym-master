"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/PaginationControls";
import EmpleadoModal from "@/components/modal/EmpleadoModal";
import EmpleadoViewModal from "@/components/modal/EmpleadoViewModal";
import EmpleadoTable from "@/components/tables/EmpleadoTable";
import { Empleado } from "@/interfaces/empleado.interface";
import { CatalogoParametrizableItem } from "@/interfaces/parametrizacion.interface";
import { useCatalogoParametrizable } from "@/hooks/useCatalogosParametrizables";
import { formatCurrencyARS } from "@/lib/comercial/productos";
import { desactivarEmpleado, getEmpleados } from "@/services/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import ExcelJS from "exceljs";
import { FileSpreadsheet, FileText, Search, UserCog, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";

const EMPLEADOS_PAGE_SIZE = 10;
type EstadoFilter = "todos" | "activos" | "inactivos";

function empleadosExportTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeEmpleadoExportText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .replace(/\s*\/\s*/g, " / ");
}

const EMPLEADO_EXPORT_DYNAMIC_TRANSLATIONS: Record<string, string> = {
  "administrativo": "Administrative",
  "administracion": "Administration",
  "administracion y caja": "Administration and cash desk",
  "recepcion y administracion": "Reception and administration",
  "caja y atencion al socio": "Cash desk and member service",
  "entrenador": "Trainer",
  "entrenadora sala musculacion": "Weight room trainer",
  "entrenamiento": "Training",
  "personal trainer": "Personal trainer",
  "mantenimiento": "Maintenance",
  "mantenimiento correctivo": "Corrective maintenance",
  "mantenimiento preventivo": "Preventive maintenance",
  "limpieza": "Cleaning",
  "limpieza tarde": "Afternoon cleaning",
  "limpieza general": "General cleaning",
  "bar / snack": "Bar / Snack",
  "atencion bar/snack": "Bar/snack service",
  "atencion bar / snack": "Bar/snack service",
  "caja bar/snack": "Bar/snack cash desk",
  "caja bar / snack": "Bar/snack cash desk",
};

function translateEmpleadoExportText(locale: GymMasterLocale, value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (locale !== "en") return raw;
  return EMPLEADO_EXPORT_DYNAMIC_TRANSLATIONS[normalizeEmpleadoExportText(raw)] ?? raw;
}

function empleadoStatusExportLabel(locale: GymMasterLocale, active?: boolean | null) {
  return active === false
    ? empleadosExportTx(locale, "Inactivo", "Inactive")
    : empleadosExportTx(locale, "Activo", "Active");
}

function empleadoStatusFilterExportLabel(locale: GymMasterLocale, filter: EstadoFilter) {
  if (filter === "activos") return empleadosExportTx(locale, "Activos", "Active");
  if (filter === "inactivos") return empleadosExportTx(locale, "Inactivos", "Inactive");
  return empleadosExportTx(locale, "Todos", "All");
}


const fallbackTiposEmpleado: CatalogoParametrizableItem[] = [
  { id: "fallback-administrativo", codigo: "administrativo", nombre: "Administrativo", descripcion: "Empleado administrativo del gimnasio.", activo: true, orden: 10 },
  { id: "fallback-entrenador", codigo: "entrenador", nombre: "Entrenador", descripcion: "Empleado responsable de entrenamiento.", activo: true, orden: 20 },
  { id: "fallback-mantenimiento", codigo: "mantenimiento", nombre: "Mantenimiento", descripcion: "Empleado responsable de mantenimiento.", activo: true, orden: 30 },
  { id: "fallback-limpieza", codigo: "limpieza", nombre: "Limpieza", descripcion: "Empleado responsable de limpieza.", activo: true, orden: 40 },
  { id: "fallback-bar-snack", codigo: "bar_snack", nombre: "Bar / Snack", descripcion: "Empleado de bar/snack.", activo: true, orden: 50 },
];

export default function EmpleadosPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const { locale } = useI18n();
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [empleadoVer, setEmpleadoVer] = useState<Empleado | null>(null);
  const { items: tiposEmpleadoCatalogo } = useCatalogoParametrizable("tipo_empleado", fallbackTiposEmpleado);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      const response = await getEmpleados();
      if (!response.ok) throw new Error(response.error || "Error al cargar empleados");
      setEmpleados(response.data || []);
    } catch (error) {
      setEmpleados([]);
      toast.error(error instanceof Error ? error.message : "Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadEmpleados();
    }
  }, [isInitialized, isAuthenticated]);

  const tipos = useMemo(() => {
    return tiposEmpleadoCatalogo
      .filter((tipo) => tipo.activo !== false)
      .map((tipo) => ({ id: tipo.id, codigo: tipo.codigo, nombre: tipo.nombre }));
  }, [tiposEmpleadoCatalogo]);

  const empleadosConTipo = useMemo(() => {
    const tiposById = new Map(tipos.map((tipo) => [tipo.id, tipo]));

    return empleados.map((empleado) => {
      if (empleado.tipo_empleado?.nombre) {
        return empleado;
      }

      const tipo = empleado.id_tipo_empleado
        ? tiposById.get(empleado.id_tipo_empleado)
        : null;

      return {
        ...empleado,
        tipo_empleado: tipo
          ? { id: tipo.id, codigo: tipo.codigo, nombre: tipo.nombre }
          : empleado.tipo_empleado ?? null,
      };
    });
  }, [empleados, tipos]);

  const filteredEmpleados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return empleadosConTipo.filter((empleado) => {
      const matchesSearch =
        term.length === 0 ||
        empleado.nombre_completo.toLowerCase().includes(term) ||
        empleado.dni.toLowerCase().includes(term) ||
        (empleado.email ?? "").toLowerCase().includes(term) ||
        (empleado.telefono ?? "").toLowerCase().includes(term) ||
        (empleado.area ?? "").toLowerCase().includes(term) ||
        (empleado.puesto ?? "").toLowerCase().includes(term) ||
        (empleado.tipo_empleado?.nombre ?? "").toLowerCase().includes(term);

      if (!matchesSearch) return false;
      if (estadoFilter === "activos" && empleado.activo === false) return false;
      if (estadoFilter === "inactivos" && empleado.activo !== false) return false;
      if (tipoFilter !== "todos" && empleado.id_tipo_empleado !== tipoFilter) return false;

      return true;
    });
  }, [empleadosConTipo, searchTerm, estadoFilter, tipoFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, estadoFilter, tipoFilter]);

  const paginatedEmpleados = useMemo(() => {
    const start = (currentPage - 1) * EMPLEADOS_PAGE_SIZE;
    return filteredEmpleados.slice(start, start + EMPLEADOS_PAGE_SIZE);
  }, [filteredEmpleados, currentPage]);

  const metrics = useMemo(() => {
    const activos = empleadosConTipo.filter((empleado) => empleado.activo !== false);
    const administrativos = activos.filter((empleado) => empleado.tipo_empleado?.codigo === "administrativo");
    const nominaEstimada = activos.reduce((total, empleado) => total + Number(empleado.sueldo_base ?? 0), 0);

    return {
      total: empleadosConTipo.length,
      activos: activos.length,
      inactivos: empleadosConTipo.length - activos.length,
      administrativos: administrativos.length,
      nominaEstimada,
    };
  }, [empleadosConTipo]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(empleadosExportTx(locale, "Empleados", "Employees"));

    worksheet.columns = [
      { header: empleadosExportTx(locale, "Nombre completo", "Full name"), key: "nombre_completo", width: 30 },
      { header: "DNI", key: "dni", width: 18 },
      { header: empleadosExportTx(locale, "Tipo", "Type"), key: "tipo", width: 24 },
      { header: empleadosExportTx(locale, "Puesto", "Position"), key: "puesto", width: 28 },
      { header: empleadosExportTx(locale, "Área", "Area"), key: "area", width: 24 },
      { header: "Email", key: "email", width: 30 },
      { header: empleadosExportTx(locale, "Teléfono", "Phone"), key: "telefono", width: 20 },
      { header: empleadosExportTx(locale, "Fecha alta", "Hire date"), key: "fecha_alta", width: 16 },
      { header: empleadosExportTx(locale, "Sueldo base", "Base salary"), key: "sueldo_base", width: 16 },
      { header: empleadosExportTx(locale, "Estado", "Status"), key: "estado", width: 12 },
    ];

    filteredEmpleados.forEach((empleado) => {
      worksheet.addRow({
        nombre_completo: empleado.nombre_completo,
        dni: empleado.dni,
        tipo: translateEmpleadoExportText(locale, empleado.tipo_empleado?.nombre) || empleadosExportTx(locale, "Sin tipo", "No type"),
        puesto: translateEmpleadoExportText(locale, empleado.puesto) || "-",
        area: translateEmpleadoExportText(locale, empleado.area) || "-",
        email: empleado.email || "-",
        telefono: empleado.telefono || "-",
        fecha_alta: empleado.fecha_alta,
        sueldo_base: empleado.sueldo_base ?? 0,
        estado: empleadoStatusExportLabel(locale, empleado.activo),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName(empleadosExportTx(locale, "listado-empleados", "employee-roster"), "xlsx");
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: empleadosExportTx(locale, "Listado de Empleados", "Employee roster"),
        subtitle: empleadosExportTx(locale, "Base operativa de empleados del gimnasio, tipos, responsabilidades y preparación para sueldos/RBAC.", "Operational employee base, types, responsibilities, and payroll/RBAC readiness."),
        fileName: empleadosExportTx(locale, "listado-empleados-gym-master", "employee-roster-gym-master"),
        locale: locale === "en" ? "en" : "es",
        footerText: empleadosExportTx(locale, "Documento generado por Gym Master.", "Document generated by Gym Master."),
        rows: filteredEmpleados,
        metrics: [
          { label: empleadosExportTx(locale, "Total", "Total"), value: metrics.total },
          { label: empleadosExportTx(locale, "Activos", "Active"), value: metrics.activos },
          { label: empleadosExportTx(locale, "Administrativos", "Administrative"), value: metrics.administrativos },
          { label: empleadosExportTx(locale, "Nómina estimada", "Estimated payroll"), value: formatCurrencyARS(metrics.nominaEstimada) },
        ],
        filtersLabel: `${empleadosExportTx(locale, "Estado", "Status")}: ${empleadoStatusFilterExportLabel(locale, estadoFilter)} · ${empleadosExportTx(locale, "Tipo", "Type")}: ${tipoFilter === "todos" ? empleadosExportTx(locale, "Todos", "All") : translateEmpleadoExportText(locale, tipos.find((tipo) => tipo.id === tipoFilter)?.nombre || tipoFilter)}${searchTerm.trim() ? ` · ${empleadosExportTx(locale, "Búsqueda", "Search")}: ${searchTerm.trim()}` : ""}`,
        columns: [
          { header: empleadosExportTx(locale, "Empleado", "Employee"), width: 40, getValue: (e) => e.nombre_completo },
          { header: "DNI", width: 22, getValue: (e) => e.dni },
          { header: empleadosExportTx(locale, "Tipo", "Type"), width: 30, getValue: (e) => translateEmpleadoExportText(locale, e.tipo_empleado?.nombre) || empleadosExportTx(locale, "Sin tipo", "No type") },
          { header: empleadosExportTx(locale, "Puesto", "Position"), width: 34, getValue: (e) => translateEmpleadoExportText(locale, e.puesto) || "-" },
          { header: empleadosExportTx(locale, "Área", "Area"), width: 26, getValue: (e) => translateEmpleadoExportText(locale, e.area) || "-" },
          { header: empleadosExportTx(locale, "Teléfono", "Phone"), width: 24, getValue: (e) => e.telefono || "-" },
          { header: empleadosExportTx(locale, "Sueldo", "Salary"), width: 22, getValue: (e) => formatCurrencyARS(e.sueldo_base ?? 0), align: "right" },
          { header: empleadosExportTx(locale, "Estado", "Status"), width: 18, getValue: (e) => empleadoStatusExportLabel(locale, e.activo) },
        ],
      });
    } catch {
      toast.error(empleadosExportTx(locale, "No se pudo generar el PDF de empleados", "Could not generate the employee PDF"));
    }
  };

  const handleDeactivate = async (empleado: Empleado) => {
    const confirmar = window.confirm(`¿Desactivar empleado ${empleado.nombre_completo}?`);
    if (!confirmar) return;

    try {
      const response = await desactivarEmpleado(empleado.id);
      if (!response.ok) throw new Error(response.error || "No se pudo desactivar empleado");
      toast.success("Empleado desactivado correctamente");
      await loadEmpleados();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al desactivar empleado");
    }
  };

  if (loading || !isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        {locale === "en" ? "Loading employees..." : "Cargando empleados..."}
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Empleados" />
          <main className="flex-1 space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total empleados</p><p className="text-2xl font-bold">{metrics.total}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Activos</p><p className="text-2xl font-bold text-emerald-600">{metrics.activos}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Administrativos</p><p className="text-2xl font-bold">{metrics.administrativos}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Nómina estimada</p><p className="text-2xl font-bold">{formatCurrencyARS(metrics.nominaEstimada)}</p></CardContent></Card>
            </div>

            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-b p-4 md:flex-nowrap">
                <div className="flex items-center gap-3">
                  <UsersRound className="h-5 w-5 text-[#02a8e1]" />
                  <div>
                    <h2 className="text-xl font-bold">Listado de Empleados</h2>
                    <p className="text-sm text-muted-foreground">Gestión integral de empleados, responsabilidades y base para sueldos/RBAC.</p>
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <select
                    aria-label={empleadosExportTx(locale, "Filtrar por estado", "Filter by status")}
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                  </select>
                  <select
                    aria-label={empleadosExportTx(locale, "Filtrar por tipo de empleado", "Filter by employee type")}
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos los tipos</option>
                    {tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}
                  </select>
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      type="search"
                      aria-label={empleadosExportTx(locale, "Buscar empleados", "Search employees")}
                      placeholder="Buscar empleado, DNI, tipo, área..."
                      className="w-full pl-8 sm:w-[300px]"
                    />
                  </div>
                  <Button onClick={handleDownloadPdf} variant="outline" className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"><FileText className="h-4 w-4" />Descargar PDF</Button>
                  <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"><FileSpreadsheet className="h-4 w-4" />Exportar</Button>
                  <Button onClick={() => setOpenModal(true)} className="bg-[#02a8e1] hover:bg-[#0288b1]"><UserCog className="mr-2 h-4 w-4" />Añadir Empleado</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="overflow-x-auto">
                  <EmpleadoTable
                    empleados={paginatedEmpleados}
                    loading={loading}
                    onEdit={(empleado) => { setSelectedEmpleado(empleado); setOpenModal(true); }}
                    onView={(empleado) => { setEmpleadoVer(empleado); setOpenViewModal(true); }}
                    onDeactivate={handleDeactivate}
                  />
                </div>
                <PaginationControls currentPage={currentPage} totalItems={filteredEmpleados.length} pageSize={EMPLEADOS_PAGE_SIZE} onPageChange={setCurrentPage} />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <EmpleadoModal open={openModal} onClose={() => { setOpenModal(false); setSelectedEmpleado(null); }} onCreated={loadEmpleados} empleado={selectedEmpleado} />
      <EmpleadoViewModal open={openViewModal} onClose={() => { setOpenViewModal(false); setEmpleadoVer(null); }} empleado={empleadoVer} />
    </SidebarProvider>
  );
}
