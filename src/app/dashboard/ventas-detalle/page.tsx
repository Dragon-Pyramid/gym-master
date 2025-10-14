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
  getAllVentaDetalles,
  deleteVentaDetalle,
} from "@/services/ventaDetalleService";
import VentaDetalleModal from "@/components/modal/VentaDetalleModal";
import VentaDetalleViewModal from "@/components/modal/VentaDetalleViewModal";
import VentaDetalleTable, {
  VentaDetalle,
} from "@/components/tables/VentaDetalleTable";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function VentaDetallePage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [detalles, setDetalles] = useState<VentaDetalle[]>([]);
  const [filteredDetalles, setFilteredDetalles] = useState<VentaDetalle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState<VentaDetalle | null>(
    null
  );
  const [openModalVer, setOpenModalVer] = useState(false);
  const [detalleVer, setDetalleVer] = useState<VentaDetalle | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadDetalles = async () => {
    setLoading(true);
    const data = await getAllVentaDetalles(user as any);
    setDetalles(data ?? []);
    setFilteredDetalles(data ?? []);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Detalles de Venta");

    worksheet.columns = [
      { header: "Venta", key: "venta_id", width: 20 },
      { header: "Producto", key: "producto_id", width: 20 },
      { header: "Cantidad", key: "cantidad", width: 10 },
      { header: "Precio Unitario", key: "precio_unitario", width: 15 },
      { header: "Subtotal", key: "subtotal", width: 15 },
    ];

    filteredDetalles.forEach((d) => {
      worksheet.addRow({
        venta_id: d.venta_id,
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Detalles_Venta.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadDetalles();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDetalles(detalles);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = detalles.filter(
      (d) =>
        d.venta_id.toLowerCase().includes(lowercaseSearch) ||
        d.producto_id.toLowerCase().includes(lowercaseSearch)
    );

    setFilteredDetalles(filtered);
  }, [searchTerm, detalles]);

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
          <AppHeader title="Detalles de Venta" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">
                  Listado de Detalles de Venta
                </h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por venta, producto..."
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
                    <span className="hidden sm:inline">Añadir Detalle</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <VentaDetalleTable
                    detalles={filteredDetalles}
                    loading={loading}
                    onEdit={(detalle) => {
                      setSelectedDetalle(detalle);
                      setOpenModal(true);
                    }}
                    onView={(detalle) => {
                      setDetalleVer(detalle);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (detalle) => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar el detalle?"
                      );
                      if (!confirmar) return;

                      try {
                        await deleteVentaDetalle(user as any, detalle.id);
                        toast.success("Detalle eliminado correctamente");
                        await loadDetalles();
                      } catch (err) {
                        toast.error("Error al eliminar detalle");
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

      <VentaDetalleModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedDetalle(null);
        }}
        onCreated={loadDetalles}
        detalle={selectedDetalle}
      />

      <VentaDetalleViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setDetalleVer(null);
        }}
        detalle={detalleVer}
      />
    </SidebarProvider>
  );
}
