"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, FileSpreadsheet } from "lucide-react";
import { getAllServicios, deleteServicio } from "@/services/servicioService";
import ServicioModal from "@/components/modal/ServicioModal";
import ServicioViewModal from "@/components/modal/ServicioViewModal";
import ServicioTable from "@/components/tables/ServicioTable";
import { Servicio } from "@/interfaces/servicio.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from '@/utils/downloadFileName';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { useI18n } from '@/i18n/I18nProvider';
import { translateCommercialUi } from '@/i18n/commercialUi';

const SERVICIOS_PAGE_SIZE = 10;

const CATEGORIA_LABELS: Record<string, string> = {
  personal_trainer: "Personal trainer",
  evaluacion: "Evaluación",
  nutricion: "Nutrición",
  clase_especial: "Clase especial",
  pase: "Pase",
  alquiler: "Alquiler",
  premium: "Premium",
  otro: "Otro",
};

function serviceExportTx(locale: string, es: string, en: string) {
  return locale === "en" ? en : es;
}

function normalizeServiceExportText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\s/.,;:()"'¿?¡!+\-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const SERVICE_EXPORT_TEXTS: Record<string, string> = {
  todos: "All",
  todas: "All",
  all: "All",
  activo: "Active",
  activos: "Active",
  active: "Active",
  inactivo: "Inactive",
  inactivos: "Inactive",
  inactive: "Inactive",
  si: "Yes",
  yes: "Yes",
  no: "No",
  servicio: "Service",
  servicios: "Services",
  listado_de_servicios: "Service list",
  alquiler: "Rental",
  rental: "Rental",
  premium: "Premium",
  otro: "Other",
  otros: "Other",
  other: "Other",
  evaluacion: "Assessment",
  assessment: "Assessment",
  nutricion: "Nutrition",
  nutrition: "Nutrition",
  clase_especial: "Special class",
  special_class: "Special class",
  pase: "Pass",
  pass: "Pass",
  personal_trainer: "Personal trainer",
  presencial: "In person",
  online: "Online",
  hibrido: "Hybrid",
  hybrid: "Hybrid",
  cama_solar: "Tanning bed",
  tanning_bed: "Tanning bed",
  servicio_de_cama_solar_incluye_bornceador_y_toalla: "Tanning bed service, includes bronzer and towel.",
  servicio_de_cama_solar_incluye_bronceador_y_toalla: "Tanning bed service, includes bronzer and towel.",
  servicio_de_orientacion_nutricional_basica_ofrecido_por_profesional_autorizado: "Basic nutritional guidance service provided by an authorized professional.",
  servicio_especial_1: "Special service 1",
  servicio_especial_2: "Special service 2",
  servicio_especial_3: "Special service 3",
  servicio_especial_4: "Special service 4",
  servicio_especial_5: "Special service 5",
  servicio_de_prueba_2: "Test service 2",
  es_un_servicio_de_prueba: "This is a test service.",
  testeo_nomas: "Test only",
  servicio_premium_mensual: "Monthly premium service",
  paquete_premium_mensual_con_beneficios_comerciales_adicionales_definidos_por_el_gimnasio: "Monthly premium package with additional commercial benefits defined by the gym.",
  orientacion_nutricional_basica: "Basic nutritional guidance",
};

function translateServiceExportText(locale: string, value?: string | null, fallback = "") {
  const original = String(value ?? fallback ?? "").trim();
  if (!original) return "";
  if (locale !== "en") return original;

  const normalized = normalizeServiceExportText(original);
  return SERVICE_EXPORT_TEXTS[normalized] ?? original;
}

function serviceNameExportLabel(locale: string, value?: string | null) {
  return translateServiceExportText(locale, value);
}

function serviceDescriptionExportLabel(locale: string, value?: string | null) {
  return translateServiceExportText(locale, value);
}

function serviceCategoryExportLabel(locale: string, value?: string | null) {
  const raw = String(value ?? "otro");
  const fromCatalog = CATEGORIA_LABELS[raw] ?? raw;
  return translateServiceExportText(locale, fromCatalog, serviceExportTx(locale, "Otro", "Other"));
}

function serviceBooleanExportLabel(locale: string, value: boolean) {
  return value ? serviceExportTx(locale, "Sí", "Yes") : serviceExportTx(locale, "No", "No");
}

function serviceStatusExportLabel(locale: string, active: boolean) {
  return active ? serviceExportTx(locale, "Activo", "Active") : serviceExportTx(locale, "Inactivo", "Inactive");
}

function serviceStatusFilterExportLabel(locale: string, filter: string) {
  if (filter === "todos") return serviceExportTx(locale, "Todos", "All");
  if (filter === "activos") return serviceExportTx(locale, "Activos", "Active");
  if (filter === "inactivos") return serviceExportTx(locale, "Inactivos", "Inactive");
  return translateServiceExportText(locale, filter);
}

function serviceCategoryFilterExportLabel(locale: string, filter: string) {
  return filter === "todas"
    ? serviceExportTx(locale, "Todas", "All")
    : serviceCategoryExportLabel(locale, filter);
}


export default function ServiciosPage() {
  const { locale } = useI18n();
  const c = (text: string) => translateCommercialUi(locale, text);

  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(
    null
  );
  const [openModalVer, setOpenModalVer] = useState(false);
  const [servicioVer, setServicioVer] = useState<Servicio | null>(null);
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadServicios = async () => {
    setLoading(true);
    const data = await getAllServicios();
    setServicios(data ?? []);
    setFilteredServicios(data ?? []);
    setLoading(false);
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: serviceExportTx(locale, "Listado de Servicios", "Service list"),
        subtitle: serviceExportTx(
          locale,
          "Reporte de servicios adicionales disponibles para venta.",
          "Additional services available for sale report.",
        ),
        fileName: serviceExportTx(locale, "listado-servicios-gym-master", "gym-master-service-list"),
        locale,
        footerText: serviceExportTx(
          locale,
          "Documento generado por Gym Master.",
          "Document generated by Gym Master.",
        ),
        labels: {
          generated: serviceExportTx(locale, "Generado", "Generated"),
          page: serviceExportTx(locale, "Página", "Page"),
          of: serviceExportTx(locale, "de", "of"),
          detail: serviceExportTx(locale, "Detalle", "Details"),
          records: serviceExportTx(locale, "registros", "records"),
          empty: serviceExportTx(
            locale,
            "No hay registros para el filtro seleccionado.",
            "No records found for the selected filter.",
          ),
        },
        rows: filteredServicios,
        metrics: [
          { label: serviceExportTx(locale, "Servicios filtrados", "Filtered services"), value: filteredServicios.length },
          { label: serviceExportTx(locale, "Activos", "Active"), value: filteredServicios.filter((s) => s.activo).length },
          { label: serviceExportTx(locale, "Requieren reserva", "Require booking"), value: filteredServicios.filter((s) => s.requiere_reserva).length },
        ],
        filtersLabel:
          serviceExportTx(locale, "Estado", "Status") +
          ": " +
          serviceStatusFilterExportLabel(locale, filtroActivo) +
          " · " +
          serviceExportTx(locale, "Categoría", "Category") +
          ": " +
          serviceCategoryFilterExportLabel(locale, filtroCategoria) +
          (searchTerm.trim()
            ? " · " + serviceExportTx(locale, "Búsqueda", "Search") + ": " + searchTerm.trim()
            : ""),
        columns: [
          { header: serviceExportTx(locale, "Servicio", "Service"), width: 42, getValue: (s) => serviceNameExportLabel(locale, s.nombre) },
          { header: serviceExportTx(locale, "Categoría", "Category"), width: 26, getValue: (s) => serviceCategoryExportLabel(locale, String(s.categoria ?? "otro")) },
          { header: serviceExportTx(locale, "Descripción", "Description"), width: 60, getValue: (s) => s.descripcion ? serviceDescriptionExportLabel(locale, s.descripcion) : "-" },
          { header: serviceExportTx(locale, "Precio", "Price"), width: 20, getValue: (s) => `$${Number(s.precio || 0).toLocaleString("es-AR")}`, align: "right" },
          { header: serviceExportTx(locale, "Duración", "Duration"), width: 18, getValue: (s) => s.duracion_minutos ? `${s.duracion_minutos} min` : "-" },
          { header: serviceExportTx(locale, "Reserva", "Booking"), width: 18, getValue: (s) => serviceBooleanExportLabel(locale, Boolean(s.requiere_reserva)) },
          { header: serviceExportTx(locale, "Estado", "Status"), width: 20, getValue: (s) => serviceStatusExportLabel(locale, Boolean(s.activo)) },
        ],
      });
    } catch {
      toast.error(serviceExportTx(locale, "No se pudo generar el PDF de servicios", "Could not generate the services PDF"));
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(serviceExportTx(locale, "Servicios", "Services"));

    worksheet.columns = [
      { header: serviceExportTx(locale, "Nombre", "Name"), key: "nombre", width: 30 },
      { header: serviceExportTx(locale, "Categoría", "Category"), key: "categoria", width: 24 },
      { header: serviceExportTx(locale, "Descripción", "Description"), key: "descripcion", width: 44 },
      { header: serviceExportTx(locale, "Precio", "Price"), key: "precio", width: 15 },
      { header: serviceExportTx(locale, "Duración minutos", "Duration minutes"), key: "duracion_minutos", width: 18 },
      { header: serviceExportTx(locale, "Requiere reserva", "Requires booking"), key: "requiere_reserva", width: 18 },
      { header: serviceExportTx(locale, "Cupo máximo", "Max capacity"), key: "cupo_maximo", width: 14 },
      { header: serviceExportTx(locale, "Modalidad", "Mode"), key: "modalidad", width: 16 },
      { header: serviceExportTx(locale, "Disponible online", "Available online"), key: "disponible_online", width: 18 },
      { header: serviceExportTx(locale, "Observaciones", "Notes"), key: "observaciones", width: 40 },
      { header: serviceExportTx(locale, "Activo", "Active"), key: "activo", width: 12 },
    ];

    filteredServicios.forEach((s) => {
      worksheet.addRow({
        nombre: serviceNameExportLabel(locale, s.nombre),
        categoria: serviceCategoryExportLabel(locale, String(s.categoria ?? "otro")),
        descripcion: s.descripcion ? serviceDescriptionExportLabel(locale, s.descripcion) : "",
        precio: s.precio,
        duracion_minutos: s.duracion_minutos ?? "",
        requiere_reserva: serviceBooleanExportLabel(locale, Boolean(s.requiere_reserva)),
        cupo_maximo: s.cupo_maximo ?? "",
        modalidad: translateServiceExportText(locale, s.modalidad ?? "presencial"),
        disponible_online: serviceBooleanExportLabel(locale, Boolean(s.disponible_online)),
        observaciones: s.observaciones ? translateServiceExportText(locale, s.observaciones) : "",
        activo: serviceStatusExportLabel(locale, Boolean(s.activo)),
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
      serviceExportTx(locale, "listado-servicios", "service-list"),
      "xlsx",
    );
    a.click();
    window.URL.revokeObjectURL(url);
  };


  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadServicios();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    let serviciosFiltrados = servicios;
    if (filtroActivo === "activos") {
      serviciosFiltrados = serviciosFiltrados.filter((s) => s.activo);
    } else if (filtroActivo === "inactivos") {
      serviciosFiltrados = serviciosFiltrados.filter((s) => !s.activo);
    }
    if (filtroCategoria !== "todas") {
      serviciosFiltrados = serviciosFiltrados.filter((s) => String(s.categoria ?? "otro") === filtroCategoria);
    }
    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      serviciosFiltrados = serviciosFiltrados.filter(
        (s) =>
          s.nombre.toLowerCase().includes(lowercaseSearch) ||
          s.descripcion.toLowerCase().includes(lowercaseSearch) ||
          String(s.categoria ?? "").toLowerCase().includes(lowercaseSearch)
      );
    }
    setFilteredServicios(serviciosFiltrados);
  }, [searchTerm, servicios, filtroActivo, filtroCategoria]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroActivo, filtroCategoria]);

  const totalServicios = filteredServicios.length;
  const totalPages = Math.max(1, Math.ceil(totalServicios / SERVICIOS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedServicios = filteredServicios.slice(
    (safeCurrentPage - 1) * SERVICIOS_PAGE_SIZE,
    safeCurrentPage * SERVICIOS_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const filtroLabel =
    filtroActivo === "todos"
      ? "Todos"
      : filtroActivo === "activos"
      ? "Activos"
      : "Inactivos";

  const categoriaLabel = filtroCategoria === "todas"
    ? "Todas"
    : CATEGORIA_LABELS[filtroCategoria] ?? "Otro";

  if (!isInitialized) {
    return <div>{c('Cargando...')}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c("Servicios")} />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">{c("Listado de Servicios")}</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex gap-2 items-center flex-grow md:flex-grow-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[120px]">
                          {c(filtroLabel)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo("todos")}
                          className={
                            filtroActivo === "todos" ? "font-bold" : ""
                          }
                        >
                          Todos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo("activos")}
                          className={
                            filtroActivo === "activos" ? "font-bold" : ""
                          }
                        >
                          Activos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo("inactivos")}
                          className={
                            filtroActivo === "inactivos" ? "font-bold" : ""
                          }
                        >
                          Inactivos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[150px]">
                          {c(categoriaLabel)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onSelect={() => setFiltroCategoria("todas")}
                          className={filtroCategoria === "todas" ? "font-bold" : ""}
                        >
                          Todas
                        </DropdownMenuItem>
                        {Object.entries(CATEGORIA_LABELS).map(([value, label]) => (
                          <DropdownMenuItem
                            key={value}
                            onSelect={() => setFiltroCategoria(value)}
                            className={filtroCategoria === value ? "font-bold" : ""}
                          >
                            {c(label)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={c("Buscar por nombre, descripción...")}
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">{c("Descargar PDF")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">{c("Exportar")}</span>
                  </Button>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">{c("Añadir Servicio")}</span>
                    <span className="sm:hidden">{c("Añadir")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <ServicioTable
                    servicios={paginatedServicios}
                    loading={loading}
                    onEdit={(servicio) => {
                      setSelectedServicio(servicio);
                      setOpenModal(true);
                    }}
                    onView={(servicio) => {
                      setServicioVer(servicio);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (servicio) => {
                      const confirmar = window.confirm(
                        servicio.activo
                          ? c("¿Está seguro de desactivar el servicio?")
                          : c("¿Está seguro de activar el servicio?")
                      );
                      if (!confirmar) return;

                      try {
                        await deleteServicio(servicio.id);
                        toast.success(
                          `${c("Servicio")} ${servicio.activo ? c("desactivado") : c("activado")} ${c("correctamente")}`
                        );
                        await loadServicios();
                      } catch (err) {
                        toast.error(c("Error al actualizar estado del servicio"));
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalServicios}
                  pageSize={SERVICIOS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="servicios"
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <ServicioModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedServicio(null);
        }}
        onCreated={loadServicios}
        servicio={selectedServicio}
      />

      <ServicioViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setServicioVer(null);
        }}
        servicio={servicioVer}
      />
    </SidebarProvider>
  );
}
