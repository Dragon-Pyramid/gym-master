"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import {
  fetchAllActividades,
  deleteActividad,
} from "@/services/actividadService";
import ActividadModal from "@/components/modal/ActividadModal";
import ActividadViewModal from "@/components/modal/ActividadViewModal";
import ActividadTable from "@/components/tables/ActividadTable";
import { Actividad } from "@/interfaces/actividad.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function ActividadesPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [filteredActividades, setFilteredActividades] = useState<Actividad[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(
    null
  );
  const [openModalVer, setOpenModalVer] = useState(false);
  const [actividadVer, setActividadVer] = useState<Actividad | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadActividades = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllActividades();
    setActividades(data ?? []);
    setFilteredActividades(data ?? []);
    setLoading(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Actividades");

    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Nombre de Actividad", key: "nombre_actividad", width: 40 },
      { header: "Creado en", key: "creado_en", width: 25 },
      { header: "Actualizado en", key: "actualizado_en", width: 25 },
    ];

    filteredActividades.forEach((a) => {
      worksheet.addRow({
        id: a.id,
        nombre_actividad: a.nombre_actividad,
        creado_en: new Date(a.creado_en).toLocaleString(),
        actualizado_en: new Date(a.actualizado_en).toLocaleString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Actividades.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteActividad = async (actividad: Actividad) => {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar la actividad "${actividad.nombre_actividad}"?`
    );
    if (!confirmar) return;

    try {
      await deleteActividad(actividad.id);
      toast.success("Actividad eliminada correctamente");
      await loadActividades();
    } catch (error: unknown) {
      toast.error("Error al eliminar actividad");
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadActividades();
    }
  }, [isInitialized, isAuthenticated, loadActividades]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredActividades(actividades);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = actividades.filter((a) =>
      a.nombre_actividad.toLowerCase().includes(lowercaseSearch)
    );

    setFilteredActividades(filtered);
  }, [searchTerm, actividades]);

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
          <AppHeader title="Actividades" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap gap-4 justify-between items-center p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Actividades</h2>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar actividad..."
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
                    onClick={() => setOpenModal(true)}
                    className="bg-[#02a8e1] hover:bg-[#0288b1]"
                  >
                    <span className="hidden sm:inline">Añadir Actividad</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <ActividadTable
                    actividades={filteredActividades}
                    loading={loading}
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
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>

      <ActividadModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedActividad(null);
        }}
        onCreated={loadActividades}
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
