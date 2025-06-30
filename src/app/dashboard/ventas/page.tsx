"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet } from "lucide-react";
import { getAllVentas, deleteVenta } from "@/services/ventaService";
import VentaModal from "@/components/modal/VentaModal";
import VentaViewModal from "@/components/modal/VentaViewModal";
import VentaTable, { Venta } from "@/components/tables/VentaTable";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function VentasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [filteredVentas, setFilteredVentas] = useState<Venta[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [ventaVer, setVentaVer] = useState<Venta | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const loadVentas = async () => {
    setLoading(true);
    const data = await getAllVentas();
    setVentas(data ?? []);
    setFilteredVentas(data ?? []);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ventas");

    worksheet.columns = [
      { header: "Socio", key: "socio_id", width: 20 },
      { header: "Total", key: "total", width: 15 },
      { header: "Fecha", key: "fecha", width: 20 },
    ];

    filteredVentas.forEach((v) => {
      worksheet.addRow({
        socio_id: v.socio_id,
        total: v.total,
        fecha: v.fecha,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Ventas.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadVentas();
    }
  }, [status]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredVentas(ventas);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = ventas.filter(
      (v) =>
        v.socio_id.toLowerCase().includes(lowercaseSearch) ||
        v.fecha.toLowerCase().includes(lowercaseSearch)
    );

    setFilteredVentas(filtered);
  }, [searchTerm, ventas]);

  if (status === "loading" || loading) {
    return <p>Cargando datos de ventas...</p>;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Ventas" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap gap-4 justify-between items-center p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Ventas</h2>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por socio, fecha..."
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
                    <span className="hidden sm:inline">Añadir Venta</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <VentaTable
                    ventas={filteredVentas}
                    loading={loading}
                    onEdit={(venta) => {
                      setSelectedVenta(venta);
                      setOpenModal(true);
                    }}
                    onView={(venta) => {
                      setVentaVer(venta);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (venta) => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar la venta?"
                      );
                      if (!confirmar) return;

                      try {
                        await deleteVenta(venta.id);
                        toast.success("Venta eliminada correctamente");
                        await loadVentas();
                      } catch (err) {
                        toast.error("Error al eliminar venta");
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

      <VentaModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedVenta(null);
        }}
        onCreated={loadVentas}
        venta={selectedVenta}
      />

      <VentaViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setVentaVer(null);
        }}
        venta={ventaVer}
      />
    </SidebarProvider>
  );
}
