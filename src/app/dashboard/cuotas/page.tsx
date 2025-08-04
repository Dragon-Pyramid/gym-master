"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import { getAllCuotas, deleteCuota } from "@/services/cuotaService";
import CuotasModal from "@/components/modal/CuotasModal";
import CuotasViewModal from "@/components/modal/CuotasViewModal";
import CuotaTable from "@/components/tables/CuotaTable";
import { Cuota } from "@/interfaces/cuota.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function CuotasPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [filteredCuotas, setFilteredCuotas] = useState<Cuota[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cuotas");

    worksheet.columns = [
      { header: "Descripción", key: "descripcion", width: 30 },
      { header: "Monto", key: "monto", width: 15 },
      { header: "Período", key: "periodo", width: 20 },
      { header: "Fecha Inicio", key: "fecha_inicio", width: 20 },
      { header: "Fecha Fin", key: "fecha_fin", width: 20 },
    ];

    filteredCuotas.forEach((c) => {
      worksheet.addRow({
        descripcion: c.descripcion,
        monto: c.monto,
        periodo: c.periodo,
        fecha_inicio: c.fecha_inicio,
        fecha_fin: c.fecha_fin,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Cuotas.xlsx";
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
  const filtroLabel =
    filtroActivo === "todos"
      ? "Todos"
      : filtroActivo === "activos"
      ? "Activos"
      : "Inactivos";

  const ordenamientoLabel =
    ordenamiento === "reciente"
      ? "Más reciente a antigua"
      : "Más antigua a reciente";

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
          <AppHeader title="Cuotas" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Cuotas</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[180px]">
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
                          Más reciente a antigua
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setOrdenamiento("antigua")}
                          className={
                            ordenamiento === "antigua" ? "font-bold" : ""
                          }
                        >
                          Más antigua a reciente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar por descripción, período..."
                        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
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
                  {isAdminOnly && (
                    <Button
                      onClick={() => setOpenModal(true)}
                      className="bg-[#02a8e1] hover:bg-[#0288b1]"
                    >
                      <span className="hidden sm:inline">Añadir Cuota</span>
                      <span className="sm:hidden">Añadir</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <CuotaTable
                    cuotas={filteredCuotas}
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
                        "¿Está seguro de eliminar la cuota?"
                      );
                      if (!confirmar) return;

                      try {
                        await deleteCuota(cuota.id);
                        toast.success("Cuota eliminada correctamente");
                        await loadCuotas();
                      } catch (err) {
                        toast.error("Error al eliminar cuota");
                      }
                    }}
                  />
                </div>
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
