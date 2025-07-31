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
import EntrenadorModal from "@/components/modal/EntrenadorModal";
import EntrenadorViewModal from "@/components/modal/EntrenadorViewModal";
import EntrenadoresTable from "@/components/tables/EntrenadoresTable";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { Entrenador } from "@/interfaces/entrenador.interface";

export default function EntrenadoresPage() {
  const { isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [filteredEntrenadores, setFilteredEntrenadores] = useState<
    Entrenador[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEntrenador, setSelectedEntrenador] =
    useState<Entrenador | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [entrenadorVer, setEntrenadorVer] = useState<Entrenador | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadEntrenadores = async () => {
    setLoading(true);
    const mockData: Entrenador[] = [
      {
        id: "1",
        nombre_completo: "Juan Pérez",
        dni: "12345678",
        fecha_alta: "2024-01-15",
        horarios_texto: "Lun-Vie: 08:00-12:00, 14:00-18:00",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
      },
    ];
    setEntrenadores(mockData);
    setFilteredEntrenadores(mockData);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Entrenadores");

    worksheet.columns = [
      { header: "Nombre completo", key: "nombre_completo", width: 30 },
      { header: "DNI", key: "dni", width: 20 },
      { header: "Fecha Alta", key: "fecha_alta", width: 20 },
      { header: "Horarios", key: "horarios_texto", width: 40 },
    ];

    filteredEntrenadores.forEach((e) => {
      worksheet.addRow({
        nombre_completo: e.nombre_completo,
        dni: e.dni,
        fecha_alta: e.fecha_alta,
        horarios_texto: e.horarios_texto,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Entrenadores.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadEntrenadores();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = entrenadores.filter(
        (e) =>
          e.nombre_completo.toLowerCase().includes(lowercaseSearch) ||
          e.dni.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredEntrenadores(filtered);
    } else {
      setFilteredEntrenadores(entrenadores);
    }
  }, [searchTerm, entrenadores]);

  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando datos de entrenadores...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Entrenadores" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Entrenadores</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="flex items-center flex-grow gap-2 md:flex-grow-0">
                    <div className="relative flex-grow md:flex-grow-0">
                      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar por nombre, DNI..."
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
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">Añadir Entrenador</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <EntrenadoresTable
                    entrenadores={filteredEntrenadores}
                    loading={loading}
                    onEdit={(entrenador: Entrenador) => {
                      setSelectedEntrenador(entrenador);
                      setOpenModal(true);
                    }}
                    onView={(entrenador: Entrenador) => {
                      setEntrenadorVer(entrenador);
                      setOpenModalVer(true);
                    }}
                    onDelete={async () => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar este entrenador?"
                      );
                      if (!confirmar) return;

                      try {
                        toast.success("Entrenador eliminado correctamente");
                        await loadEntrenadores();
                      } catch {
                        toast.error("Error al eliminar entrenador");
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

      <EntrenadorModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedEntrenador(null);
        }}
        onCreated={loadEntrenadores}
        entrenador={selectedEntrenador}
      />

      <EntrenadorViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setEntrenadorVer(null);
        }}
        entrenador={entrenadorVer}
      />
    </SidebarProvider>
  );
}
