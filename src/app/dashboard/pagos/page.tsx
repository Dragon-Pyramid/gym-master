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
import { getAllPagos, deletePago } from "@/services/pagoService";
import PagoModal from "@/components/modal/PagoModal";
import PagoViewModal from "@/components/modal/PagoViewModal";
import PagoTable from "@/components/tables/PagoTable";
import { ResponsePago } from "@/interfaces/pago.interface";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function PagosPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const [pagos, setPagos] = useState<ResponsePago[]>([]);
  const [filteredPagos, setFilteredPagos] = useState<ResponsePago[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<ResponsePago | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [pagoVer, setPagoVer] = useState<ResponsePago | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadPagos = async () => {
    setLoading(true);
    const data = await getAllPagos();
    setPagos(data ?? []);
    setFilteredPagos(data ?? []);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Pagos");

    worksheet.columns = [
      { header: "Socio", key: "socio", width: 20 },
      { header: "Cuota", key: "cuota", width: 20 },
      { header: "Fecha Pago", key: "fecha_pago", width: 20 },
      { header: "Vencimiento", key: "fecha_vencimiento", width: 20 },
      { header: "Monto Pagado", key: "monto_pagado", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Registrado Por", key: "registrado_por", width: 20 },
    ];

    filteredPagos.forEach((p) => {
      worksheet.addRow({
        socio: p.socio?.nombre_completo || "",
        cuota: p.cuota?.descripcion || "",
        fecha_pago: p.fecha_pago,
        fecha_vencimiento: p.fecha_vencimiento,
        monto_pagado: p.monto_pagado,
        total: p.total,
        registrado_por: p.registrado_por?.nombre || "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Listado_Pagos.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadPagos();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPagos(pagos);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = pagos.filter(
      (p) =>
        (p.socio?.nombre_completo || "")
          .toLowerCase()
          .includes(lowercaseSearch) ||
        (p.cuota?.descripcion || "").toLowerCase().includes(lowercaseSearch) ||
        (p.registrado_por?.nombre || "").toLowerCase().includes(lowercaseSearch)
    );

    setFilteredPagos(filtered);
  }, [searchTerm, pagos]);

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
          <AppHeader title="Pagos" />
          <main className="flex-1 p-6 space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap">
                <h2 className="text-xl font-bold">Listado de Pagos</h2>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por socio, cuota, usuario..."
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
                    <span className="hidden sm:inline">Añadir Pago</span>
                    <span className="sm:hidden">Añadir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <PagoTable
                    pagos={filteredPagos}
                    loading={loading}
                    onEdit={(pago) => {
                      setSelectedPago(pago);
                      setOpenModal(true);
                    }}
                    onView={(pago) => {
                      setPagoVer(pago);
                      setOpenModalVer(true);
                    }}
                    onDelete={async (pago) => {
                      const confirmar = window.confirm(
                        "¿Está seguro de eliminar el pago?"
                      );
                      if (!confirmar) return;

                      try {
                        await deletePago(pago.id);
                        toast.success("Pago eliminado correctamente");
                        await loadPagos();
                      } catch (err) {
                        toast.error("Error al eliminar pago");
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

      <PagoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedPago(null);
        }}
        onCreated={loadPagos}
        pago={selectedPago}
      />

      <PagoViewModal
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setPagoVer(null);
        }}
        pago={
          pagoVer
            ? {
                id: pagoVer.id,
                socio_id: pagoVer.socio?.id_socio ?? "",
                cuota_id: pagoVer.cuota?.id ?? "",
                fecha_pago: pagoVer.fecha_pago,
                fecha_vencimiento: pagoVer.fecha_vencimiento,
                monto_pagado: pagoVer.monto_pagado,
                total: pagoVer.total,
                registrado_por: pagoVer.registrado_por?.id ?? "",
                enviar_email: pagoVer.enviar_email ?? false,
              }
            : null
        }
      />
    </SidebarProvider>
  );
}
