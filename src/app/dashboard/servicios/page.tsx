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
import ServicioTable, { Servicio } from "@/components/tables/ServicioTable";
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

const SERVICIOS_PAGE_SIZE = 10;

export default function ServiciosPage() {
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
        title: "Listado de Servicios",
        subtitle: "Reporte de servicios adicionales disponibles para venta.",
        fileName: "listado-servicios-gym-master",
        rows: filteredServicios,
        metrics: [
          { label: "Servicios filtrados", value: filteredServicios.length },
          { label: "Activos", value: filteredServicios.filter((s) => s.activo).length },
        ],
        filtersLabel: `Estado: ${filtroLabel}${searchTerm.trim() ? ` · Búsqueda: ${searchTerm.trim()}` : ""}`,
        columns: [
          { header: "Servicio", width: 46, getValue: (s) => s.nombre },
          { header: "Descripción", width: 70, getValue: (s) => s.descripcion || "-" },
          { header: "Precio", width: 24, getValue: (s) => `$${Number(s.precio || 0).toLocaleString("es-AR")}`, align: "right" },
          { header: "Estado", width: 24, getValue: (s) => (s.activo ? "Activo" : "Inactivo") },
        ],
      });
    } catch {
      toast.error("No se pudo generar el PDF de servicios");
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Servicios");

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Precio", key: "precio", width: 15 },
      { header: "Activo", key: "activo", width: 10 },
    ];

    filteredServicios.forEach((s) => {
      worksheet.addRow({
        nombre: s.nombre,
        descripcion: s.descripcion,
        precio: s.precio,
        activo: s.activo ? "Sí" : "No",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName("listado-servicios", "xlsx");
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
    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      serviciosFiltrados = serviciosFiltrados.filter(
        (s) =>
          s.nombre.toLowerCase().includes(lowercaseSearch) ||
          s.descripcion.toLowerCase().includes(lowercaseSearch)
      );
    }
    setFilteredServicios(serviciosFiltrados);
  }, [searchTerm, servicios, filtroActivo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroActivo]);

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
          <AppHeader title="Servicios" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Servicios</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex gap-2 items-center flex-grow md:flex-grow-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[120px]">
                          {filtroLabel}
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
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar por nombre, descripción..."
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
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">Añadir Servicio</span>
                    <span className="sm:hidden">Añadir</span>
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
                          ? "¿Está seguro de desactivar el servicio?"
                          : "¿Está seguro de activar el servicio?"
                      );
                      if (!confirmar) return;

                      try {
                        await deleteServicio(servicio.id);
                        toast.success(
                          `Servicio ${
                            servicio.activo ? "desactivado" : "activado"
                          } correctamente`
                        );
                        await loadServicios();
                      } catch (err) {
                        toast.error("Error al actualizar estado del servicio");
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
