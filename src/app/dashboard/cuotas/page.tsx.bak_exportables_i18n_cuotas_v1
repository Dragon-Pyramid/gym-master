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
import { getAllCuotas, deleteCuota } from "@/services/cuotaService";
import CuotasModal from "@/components/modal/CuotasModal";
import CuotasViewModal from "@/components/modal/CuotasViewModal";
import CuotaTable from "@/components/tables/CuotaTable";
import { Cuota } from "@/interfaces/cuota.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { buildTimestampedDownloadFileName } from "@/utils/downloadFileName";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { downloadCommercialReportPdf } from "@/utils/commercialReportPdf";
import { formatFrontendDate } from "@/utils/dateFormat";
import { useI18n } from "@/i18n/I18nProvider";

const CUOTAS_PAGE_SIZE = 10;

function translateFeeDescription(value: string | null | undefined, isEnglish: boolean) {
  if (!value || !isEnglish) return value || "-";

  const monthMap: Record<string, string> = {
    ENERO: "JANUARY",
    FEBRERO: "FEBRUARY",
    MARZO: "MARCH",
    ABRIL: "APRIL",
    MAYO: "MAY",
    JUNIO: "JUNE",
    JULIO: "JULY",
    AGOSTO: "AUGUST",
    SEPTIEMBRE: "SEPTEMBER",
    SETIEMBRE: "SEPTEMBER",
    OCTUBRE: "OCTOBER",
    NOVIEMBRE: "NOVEMBER",
    DICIEMBRE: "DECEMBER",
  };

  return value.replace(
    /\b(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi,
    (match) => monthMap[match.toUpperCase()] || match,
  );
}

export default function CuotasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [filteredCuotas, setFilteredCuotas] = useState<Cuota[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [cuotaVer, setCuotaVer] = useState<Cuota | null>(null);
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [ordenamiento, setOrdenamiento] = useState("reciente");
  const userRole = user?.rol;
  const isAdminOnly = userRole === "admin";

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadCuotas = async () => {
    setLoading(true);
    const data = await getAllCuotas();
    setCuotas(data ?? []);
    setFilteredCuotas(data ?? []);
    setLoading(false);
  };

  const handleDownloadPdf = async () => {
    try {
      await downloadCommercialReportPdf({
        title: tx("Listado de Cuotas", "Fees list"),
        subtitle: tx(
          "Reporte de cuotas, períodos y estado vigente.",
          "Report of fees, periods, and current status.",
        ),
        fileName: isEnglish ? "fees-list-gym-master" : "listado-cuotas-gym-master",
        rows: filteredCuotas,
        metrics: [
          { label: tx("Cuotas filtradas", "Filtered fees"), value: filteredCuotas.length },
          {
            label: tx("Activas", "Active"),
            value: filteredCuotas.filter((c) => c.activo).length,
          },
        ],
        filtersLabel: `${tx("Estado", "Status")}: ${filtroLabel} · ${tx("Orden", "Sort")}: ${ordenamientoLabel}${
          searchTerm.trim() ? ` · ${tx("Búsqueda", "Search")}: ${searchTerm.trim()}` : ""
        }`,
        columns: [
          {
            header: tx("Descripción", "Description"),
            width: 55,
            getValue: (c) => translateFeeDescription(c.descripcion, isEnglish),
          },
          {
            header: tx("Monto", "Amount"),
            width: 26,
            getValue: (c) => `$${Number(c.monto || 0).toLocaleString("es-AR")}`,
            align: "right",
          },
          { header: tx("Período", "Period"), width: 30, getValue: (c) => c.periodo || "-" },
          {
            header: tx("Fecha inicio", "Start date"),
            width: 30,
            getValue: (c) => formatFrontendDate(c.fecha_inicio),
          },
          {
            header: tx("Fecha fin", "End date"),
            width: 30,
            getValue: (c) => formatFrontendDate(c.fecha_fin),
          },
          {
            header: tx("Estado", "Status"),
            width: 24,
            getValue: (c) => (c.activo ? tx("Activa", "Active") : tx("Inactiva", "Inactive")),
          },
        ],
      });
    } catch {
      toast.error(tx("No se pudo generar el PDF de cuotas", "Could not generate the fees PDF"));
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tx("Cuotas", "Fees"));

    worksheet.columns = [
      { header: tx("Descripción", "Description"), key: "descripcion", width: 30 },
      { header: tx("Monto", "Amount"), key: "monto", width: 15 },
      { header: tx("Período", "Period"), key: "periodo", width: 20 },
      { header: tx("Fecha Inicio", "Start date"), key: "fecha_inicio", width: 20 },
      { header: tx("Fecha Fin", "End date"), key: "fecha_fin", width: 20 },
    ];

    filteredCuotas.forEach((c) => {
      worksheet.addRow({
        descripcion: translateFeeDescription(c.descripcion, isEnglish),
        monto: c.monto,
        periodo: c.periodo,
        fecha_inicio: formatFrontendDate(c.fecha_inicio),
        fecha_fin: formatFrontendDate(c.fecha_fin),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildTimestampedDownloadFileName(isEnglish ? "fees-list" : "listado-cuotas", "xlsx");
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadCuotas();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    let cuotasFiltradas = cuotas;
    if (filtroActivo === "activos") {
      cuotasFiltradas = cuotasFiltradas.filter((c) => c.activo);
    } else if (filtroActivo === "inactivos") {
      cuotasFiltradas = cuotasFiltradas.filter((c) => !c.activo);
    }
    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      cuotasFiltradas = cuotasFiltradas.filter(
        (c) =>
          c.descripcion.toLowerCase().includes(lowercaseSearch) ||
          c.periodo.toLowerCase().includes(lowercaseSearch)
      );
    }

    cuotasFiltradas = cuotasFiltradas.sort((a, b) => {
      const fechaA = new Date(a.fecha_inicio || "");
      const fechaB = new Date(b.fecha_inicio || "");
      return ordenamiento === "reciente"
        ? fechaB.getTime() - fechaA.getTime()
        : fechaA.getTime() - fechaB.getTime();
    });

    setFilteredCuotas(cuotasFiltradas);
  }, [searchTerm, cuotas, filtroActivo, ordenamiento]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroActivo, ordenamiento]);

  const totalCuotas = filteredCuotas.length;
  const totalPages = Math.max(1, Math.ceil(totalCuotas / CUOTAS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCuotas = filteredCuotas.slice(
    (safeCurrentPage - 1) * CUOTAS_PAGE_SIZE,
    safeCurrentPage * CUOTAS_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const filtroLabel =
    filtroActivo === "todos"
      ? tx("Todos", "All")
      : filtroActivo === "activos"
      ? tx("Activos", "Active")
      : tx("Inactivos", "Inactive");

  const ordenamientoLabel =
    ordenamiento === "reciente"
      ? tx("Más reciente a antigua", "Newest to oldest")
      : tx("Más antigua a reciente", "Oldest to newest");

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
          <AppHeader title={tx("Cuotas", "Fees")} />
          <main className="flex-1 p-6 space-y-6 dark:bg-black">
            <Card className="w-full dark:border-neutral-800 dark:bg-neutral-950/80">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap dark:border-neutral-800">
                <h2 className="text-xl font-bold text-foreground">{tx("Listado de Cuotas", "Fees list")}</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[120px] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
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
                          {tx("Todos", "All")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo("activos")}
                          className={
                            filtroActivo === "activos" ? "font-bold" : ""
                          }
                        >
                          {tx("Activos", "Active")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setFiltroActivo("inactivos")}
                          className={
                            filtroActivo === "inactivos" ? "font-bold" : ""
                          }
                        >
                          {tx("Inactivos", "Inactive")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[180px] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                          {ordenamientoLabel}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onSelect={() => setOrdenamiento("reciente")}
                          className={
                            ordenamiento === "reciente" ? "font-bold" : ""
                          }
                        >
                          {tx("Más reciente a antigua", "Newest to oldest")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setOrdenamiento("antigua")}
                          className={
                            ordenamiento === "antigua" ? "font-bold" : ""
                          }
                        >
                          {tx("Más antigua a reciente", "Oldest to newest")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={tx("Buscar por descripción, período...", "Search by description, period...")}
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full dark:border-neutral-800 dark:bg-black dark:text-neutral-100 dark:placeholder:text-neutral-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:border-cyan-900/70 dark:bg-neutral-950 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">{tx("Descargar PDF", "Download PDF")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-white border-[#02a8e1] text-[#02a8e1] hover:bg-[#e6f7fd] dark:border-cyan-900/70 dark:bg-neutral-950 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">{tx("Exportar", "Export")}</span>
                  </Button>
                  {isAdminOnly && (
                    <Button
                      onClick={() => setOpenModal(true)}
                      className="bg-[#02a8e1] hover:bg-[#0288b1]"
                    >
                      <span className="hidden sm:inline">{tx("Añadir Cuota", "Add fee")}</span>
                      <span className="sm:hidden">{tx("Añadir", "Add")}</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <CuotaTable
                    cuotas={paginatedCuotas}
                    loading={loading}
                    onEdit={(cuota) => {
                      setSelectedCuota(cuota);
                      setOpenModal(true);
                    }}
                    onView={(cuota) => {
                      setCuotaVer(cuota);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (cuota) => {
                      const confirmar = window.confirm(
                        tx("¿Está seguro de eliminar la cuota?", "Are you sure you want to delete this fee?")
                      );
                      if (!confirmar) return;

                      try {
                        await deleteCuota(cuota.id);
                        toast.success(tx("Cuota eliminada correctamente", "Fee deleted successfully"));
                        await loadCuotas();
                      } catch (err) {
                        toast.error(tx("Error al eliminar cuota", "Error deleting fee"));
                      }
                    }}
                  />
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalCuotas}
                  pageSize={CUOTAS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel={tx("cuotas", "fees")}
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <CuotasModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedCuota(null);
        }}
        onCreated={loadCuotas}
        cuota={selectedCuota}
      />

      <CuotasViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setCuotaVer(null);
        }}
        cuota={cuotaVer}
      />
    </SidebarProvider>
  );
}
