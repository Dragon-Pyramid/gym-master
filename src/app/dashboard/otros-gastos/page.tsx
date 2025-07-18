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
import {
  getAllOtrosGastos,
  deleteOtrosGastos,
} from "@/services/otrosGastosService";
import OtrosGastosModal from "@/components/modal/OtrosGastosModal";
import OtrosGastosViewModal from "@/components/modal/OtrosGastosViewModal";
import OtrosGastosTable, {
  OtrosGastos,
} from "@/components/tables/OtrosGastosTable";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function OtrosGastosPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [gastos, setGastos] = useState<OtrosGastos[]>([]);
  const [filteredGastos, setFilteredGastos] = useState<OtrosGastos[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<OtrosGastos | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [gastoVer, setGastoVer] = useState<OtrosGastos | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadGastos = async () => {
    setLoading(true);
    const data = await getAllOtrosGastos();
    setGastos(data ?? []);
    setFilteredGastos(data ?? []);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Otros Gastos");

    worksheet.columns = [
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Monto", key: "monto", width: 15 },
      { header: "Fecha", key: "fecha", width: 20 },
    ];

    filteredGastos.forEach((g) => {
      worksheet.addRow({
        descripcion: g.descripcion,
        monto: g.monto,
        fecha: g.fecha,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Otros_Gastos.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadGastos();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredGastos(gastos);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = gastos.filter(
      (g) =>
        g.descripcion.toLowerCase().includes(lowercaseSearch) ||
        g.fecha.toLowerCase().includes(lowercaseSearch)
    );

    setFilteredGastos(filtered);
  }, [searchTerm, gastos]);

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
          <AppHeader title="Otros Gastos" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap gap-4 justify-between items-center p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Otros Gastos</h2>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por descripción, fecha..."
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
                    <span className="hidden sm:inline">Añadir Gasto</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <OtrosGastosTable
                    gastos={filteredGastos}
                    loading={loading}
                    onEdit={(gasto) => {
                      setSelectedGasto(gasto);
                      setOpenModal(true);
                    }}
                    onDelete={async (gasto) => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar el gasto?"
                      );
                      if (!confirmar) return;

                      try {
                        await deleteOtrosGastos(gasto.id);
                        toast.success("Gasto eliminado correctamente");
                        await loadGastos();
                      } catch (err) {
                        toast.error("Error al eliminar gasto");
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

      <OtrosGastosModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedGasto(null);
        }}
        onCreated={loadGastos}
        gasto={selectedGasto}
      />

      <OtrosGastosViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setGastoVer(null);
        }}
        gasto={gastoVer}
      />
    </SidebarProvider>
  );
}
