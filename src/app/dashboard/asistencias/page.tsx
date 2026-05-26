"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet, MonitorUp } from "lucide-react";
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
import ExcelJS from "exceljs";
import { JwtUser } from "@/interfaces/jwtUser.interface";

const ASISTENCIAS_PAGE_SIZE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAsistencia, setSelectedAsistencia] =
    useState<Asistencia | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [asistenciaVer, setAsistenciaVer] = useState<Asistencia | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadAsistencias = useCallback(async () => {
    setLoading(true);
    const data = await getAllAsistencias(user as JwtUser);
    const orderedData = sortAsistenciasByIngresoDesc(data ?? []);
    setAsistencias(orderedData);
    setFilteredAsistencias(orderedData);
    setCurrentPage(1);
    setLoading(false);
  }, [user]);

  const handlePrint = () => {
    window.print();
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
    a.download = "Listado_Asistencias.xlsx";
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

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadAsistencias();
    }
  }, [isInitialized, isAuthenticated, loadAsistencias]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (normalizedSearch === "") {
      setFilteredAsistencias(asistencias);
      setCurrentPage(1);
      return;
    }

    const filtered = asistencias.filter((a) => {
      const socioNombre =
        "socio" in a && a.socio?.nombre_completo ? a.socio.nombre_completo : "";

      return (
        a.socio_id.toLowerCase().includes(normalizedSearch) ||
        a.fecha.toLowerCase().includes(normalizedSearch) ||
        (a.hora_ingreso ?? "").toLowerCase().includes(normalizedSearch) ||
        socioNombre.toLowerCase().includes(normalizedSearch)
      );
    });

    setFilteredAsistencias(sortAsistenciasByIngresoDesc(filtered));
    setCurrentPage(1);
  }, [searchTerm, asistencias]);

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
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd]"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Imprimir</span>
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
